import { createRetrievalChain } from '@langchain/classic/chains/retrieval';
import { createStuffDocumentsChain } from '@langchain/classic/chains/combine_documents';
import { createHistoryAwareRetriever } from '@langchain/classic/chains/history_aware_retriever';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AzureChatOpenAI } from '@langchain/openai';
import { ChatBedrockConverse } from '@langchain/aws';
import {
  StateGraph,
  START,
  END,
  MemorySaver,
  messagesStateReducer,
  Annotation,
} from '@langchain/langgraph';
import { selectEmbeddings } from './embeddings-models.js';
import { createRetriever } from './retriever.js';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { LanguageModelLike } from '@langchain/core/language_models/base';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import log4js from 'log4js';
import { models } from './constants.js';

const logger = log4js.getLogger();

interface SelectLlmResult {
  platform: 'aws' | 'azure';
  modelName: string;
  model: LanguageModelLike & BaseChatModel;
}

export function selectLlm(modelType?: string): SelectLlmResult {
  const model = models.find((model) => model.id === modelType);
  if (!model) {
    logger.error(`Model type "${modelType}" is not supported.`);
    logger.error(`Supported model types: ${models.map((model) => model.id).join(', ')}`);
    throw new Error(`Model type "${modelType}" is not supported.`);
  }

  if (model.platform === 'aws') {
    const region = process.env.BEDROCK_AWS_REGION;
    logger.debug(`use: ${model.modelId} on Amazon Bedrock`);
    const modelId = model.modelId;
    return {
      platform: 'aws',
      modelName: modelId,
      model: new ChatBedrockConverse({
        model: modelId,
        ...(model.temperatureSupport ? { temperature: 0 } : {}),
        streaming: true,
        metadata: {
          tag: 'chat',
        },
        region,
      }),
    };
  }

  logger.debug(`use: ${model.modelId} on Azure OpenAI Service`);
  return {
    platform: 'azure',
    modelName: model.modelId,
    model: new AzureChatOpenAI({
      azureOpenAIApiDeploymentName: model.modelId,
      ...(model.temperatureSupport ? { temperature: 0 } : {}),
      streaming: true,
      metadata: {
        tag: 'chat',
      },
    }),
  };
}

// Define the State interface
const GraphAnnotation = Annotation.Root({
  input: Annotation<string>(),
  chat_history: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  context: Annotation<string>(),
  answer: Annotation<string>(),
});

export async function createGraph({
  embeddingType,
  modelType,
}: {
  embeddingType?: string
  modelType?: string,
}) {
  const { model: embeddings } = selectEmbeddings({
    type: embeddingType ?? 'titan', dataSource: process.env.PINECONE_INDEX ?? '',
  });

  const retriever = await createRetriever({ embeddings });

  logger.info('modelType', { modelType });
  const { platform, model, modelName } = selectLlm(modelType);

  const systemPrompt = `You are an assistant for question-answering tasks.
Use the following pieces of retrieved context to answer the question.
If you don't know the answer, say that you don't know.
Use three sentences maximum and keep the answer concise.

{context}`;
  const qaPrompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    new MessagesPlaceholder('chat_history'),
    ['user', '{input}'],
  ]);

  const documentChain = await createStuffDocumentsChain({
    llm: model,
    prompt: qaPrompt,
  });

  const historyAwarePrompt = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder('chat_history'),
    ['user', '{input}'],
    [
      'user',
      'Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.',
    ],
  ]);

  const historyAwareRetrieverChain = await createHistoryAwareRetriever({
    llm: model,
    retriever,
    rephrasePrompt: historyAwarePrompt,
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever: historyAwareRetrieverChain,
  });

  // Define the call_model function
  async function callModel(state: typeof GraphAnnotation.State) {
    const response = await retrievalChain.invoke(state);
    return {
      chat_history: [
        new HumanMessage(state.input),
        new AIMessage(response.answer),
      ],
      context: response.context,
      answer: response.answer,
    };
  }

  // Create the workflow
  const workflow = new StateGraph(GraphAnnotation)
    .addNode('model', callModel)
    .addEdge(START, 'model')
    .addEdge('model', END);

  // Compile the graph with a checkpointer object
  const memory = new MemorySaver();
  return {
    platform,
    modelName,
    graph: workflow.compile({ checkpointer: memory }),
  };
}
