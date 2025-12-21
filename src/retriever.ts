import { Embeddings } from '@langchain/core/embeddings';
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

async function createRetriever({embeddings}: {embeddings: Embeddings}) {
  const vectorStore = new MemoryVectorStore(embeddings);
  return vectorStore.asRetriever();
}

export { createRetriever };
