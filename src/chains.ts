import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import { BaseMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableBranch, RunnableSequence, RunnablePassthrough, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from "@langchain/classic/stores/message/in_memory";
import { selectEmbeddings } from "./embeddings-models.js";
import { selectLlm } from "./llm.js";
import { createRetriever } from "./retriever.js";
import { createLogger } from './logger.js'

const logger = await createLogger();

// インメモリでメッセージ履歴を保存するストア
const messageHistories: Record<string, ChatMessageHistory> = {};

export async function createChain({
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

  const systemPrompt = `あなたはドキュメント(文書)の内容を元に質問応答のアシスタントです。

以下は検索された文書の内容です。文書の構造（見出し、セクション、テーブルなど）を考慮して回答してください。

<documents>
{context}
</documents>

質問: {input}

回答の際は以下に注意してください:
- 文書の階層構造や見出しを参照して回答する
- テーブルや箇条書きの情報は構造を保持したまま提示する
- どのセクションから情報を取得したか明記する
- メタデータ（ページ番号、セクション名など）があれば活用する
- コンテキストに含まれない内容は回答しない

回答:`;
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
    runName: "history_aware_retriever",
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever: historyAwareRetrieverChain,
  });

  const chain = new RunnableWithMessageHistory({
    runnable: retrievalChain,
    getMessageHistory: async (sessionId) => {
      if (!(sessionId in messageHistories)) {
        messageHistories[sessionId] = new ChatMessageHistory();
      }
      return messageHistories[sessionId];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
  });

  // Compile the graph with a checkpointer object
  return {
    platform,
    modelName,
    chain,
  };
}
