import 'dotenv/config';

import './instrumentation.js';
import { createLogger } from './logger.js'
import { createGraph } from './graph.js';
// import { createChain } from './chains.js';

const logger = await createLogger();

export async function handle(
  event: { question: string, model: string, embeddings: string, sessionId: string, threadId: string },
  output: NodeJS.WritableStream,
) {
  logger.info('event', { event });
  const {
    question,
    model: modelType,
    embeddings: embeddingType,
    sessionId,
    threadId,
  } = event;

  try {
    const { platform, graph: app } = await createGraph({
      embeddingType,
      modelType,
    });

    // const { platform, chain: app } = await createChain({
    //   embeddingType,
    //   modelType,
    // });
    const stream = await app.streamEvents(
      { input: question },
      {
        version: 'v2',
        configurable: {
          sessionId,
          thread_id: threadId,
        },
      },
    );
    for await (const sEvent of stream) {
      logger.trace('event', sEvent);
      if (sEvent.event === 'on_chat_model_stream') {
        const chunk = sEvent.data.chunk;
        if (platform === 'aws') {
          output.write(chunk.content ?? '');
        } else {
          output.write(chunk.text ?? '');
        }
      }
    }
    output.write('\n');
  } catch (e) {
    logger.error('', JSON.parse(JSON.stringify(e)));
    output.write(`Error: ${(e as Error).message}\n`);
  }
}
