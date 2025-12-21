import 'dotenv/config';
import * as readline from 'readline/promises';
import { v7 as uuidv7 } from 'uuid';
import log4js from 'log4js';
import { stdout } from 'node:process';
import { handle } from './app.js';

const logger = log4js.getLogger();


const model = process.env.LLM_MODEL || 'nova-micro';
const embeddings = process.env.EMBEDDINGS || 'amazon.titan-embed-text-v2:0';

logger.info(model);
logger.info(embeddings);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const sessionId = uuidv7();
while (true) {
  const answer = await rl.question('質問を入力してください： ');
  logger.info(answer);
  if (answer.length === 0) {
    rl.pause();
  }
  if (answer === '/exit' || answer === '/quit') {
    rl.close();
    process.exit(0);
  }
  await handle({question: answer, model, embeddings, sessionId }, stdout);
}
