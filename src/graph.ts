import { selectEmbeddings } from './embeddings-models.js';
import { createRetriever } from './retriever.js';
import { createLogger } from './logger.js';
import { selectLlm } from './llm.js';
import { createRetrievalChain } from '@langchain/classic/chains/retrieval';
import { createStuffDocumentsChain } from '@langchain/classic/chains/combine_documents';
// Fix https://github.com/langchain-ai/langchainjs/issues/9300
// import { createHistoryAwareRetriever } from '@langchain/classic/chains/history_aware_retriever';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import {
  StateGraph,
  START,
  END,
  MemorySaver,
  messagesStateReducer,
  Annotation,
} from '@langchain/langgraph';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { RunnableBranch, RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

const logger = await createLogger();

const memory = new MemorySaver();

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
  embeddingType: string
  modelType: string,
}) {
  const { model: embeddings } = selectEmbeddings({
    type: embeddingType,
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


  const rephrasePrompt = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder('chat_history'),
    ['user', '{input}'],
    [
      'system',
      'Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.',
    ],
  ]);

  // Fix <https://github.com/langchain-ai/langchainjs/issues/9300>
  // const historyAwareRetrieverChain = await createHistoryAwareRetriever({
  //   llm: model,
  //   retriever,
  //   rephrasePrompt,
  // });

  // Refercense follows
  // - <https://github.com/langchain-ai/langchainjs/issues/9300>
  // - <https://github.com/langchain-ai/langchainjs/blob/cc502e1b67dbadcd123a7ea2964c791c2bbad581/libs/langchain-classic/src/chains/history_aware_retriever.ts#L76-L89>
  const historyAwareRetrieverChain = RunnableBranch.from([
    [
      (input: { input: string; chat_history?: string | BaseMessage[] }) => !input.chat_history || input.chat_history.length === 0,
      RunnableSequence.from([() => new RunnablePassthrough(), retriever]),  // Use RunnablePassthrough, not input
    ],
    RunnableSequence.from([
      new RunnablePassthrough(),
      rephrasePrompt,
      model,
      new StringOutputParser(),
      retriever,
    ]),
  ]).withConfig({
    runName: 'history_aware_retriever',
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
  return {
    platform,
    modelName,
    graph: workflow.compile({ checkpointer: memory }),
  };
}
