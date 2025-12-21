import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { BedrockEmbeddings } from '@langchain/aws';
import { Embeddings } from '@langchain/core/embeddings';
import { embeddings } from './constants.js';
import log4js from 'log4js';

const logger = log4js.getLogger();
log4js.configure({
  appenders: {
    out: { type: "stdout" },
  },
  categories: {
    default: { appenders: ["out"], level: "debug" },
  },
});

interface EmbeddingsModel {
  model: Embeddings
}

function selectEmbeddings(
  {
    type,
  }: { type: string },
): EmbeddingsModel {

  logger.info(type);

  const embedding = embeddings.find((embedding) => embedding.id === type);
  if (embedding?.platform === 'azure') {
    return {
      model: new AzureOpenAIEmbeddings({
        model: embedding?.modelId,
      }),
    };
  }
  return {
    model: new BedrockEmbeddings({
      region: process.env.BEDROCK_AWS_REGION ?? 'us-west-2',
      model: embedding?.modelId,
    }),
  };
}

export { selectEmbeddings };
