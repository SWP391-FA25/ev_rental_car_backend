import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { env } from './src/config/env.js';

const server = createServer(app);

server.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
