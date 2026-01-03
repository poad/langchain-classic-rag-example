import 'dotenv/config';
import * as readline from 'readline/promises';
import { v7 as uuidv7 } from 'uuid';
import { stdout } from 'node:process';
import { handle } from './app.js';
import { createLogger } from './logger.js'

const logger = await createLogger();

const model = process.env.LLM_MODEL || 'nova-micro';
const embeddings = process.env.EMBEDDINGS || 'amazon.titan-embed-text-v2:0';

logger.info(model);
logger.info(embeddings);

const main = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const threadId = uuidv7()
  while (true) {
    const sessionId = uuidv7();
    const answer = await rl.question('Input the question: ');
    logger.info(answer);
    if (answer.length === 0) {
      rl.pause();
    }
    if (answer === '/exit' || answer === '/quit') {
      rl.close();
      process.exit(0);
    }
    await handle({ question: answer, model, embeddings, sessionId, threadId }, stdout);
  }
}

main();
