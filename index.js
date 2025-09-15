import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';

const server = createServer(app);

server.listen(process.env.PORT || 3000, () => {
  console.log(
    `API server listening on http://localhost:${process.env.PORT || 3000}`
  );
});
