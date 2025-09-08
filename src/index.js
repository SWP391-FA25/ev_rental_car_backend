import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';

const server = createServer(app);

server.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
