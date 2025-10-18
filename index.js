import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
async function createUploadsDirectory() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const paymentsDir = path.join(uploadsDir, 'payments');
  
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  
  try {
    await fs.access(paymentsDir);
  } catch {
    await fs.mkdir(paymentsDir, { recursive: true });
  }
}

// Create uploads directory on startup
createUploadsDirectory().catch(console.error);

const server = createServer(app);

server.listen(process.env.PORT || 3000, () => {
  console.log(
    `API server listening on http://localhost:${process.env.PORT || 3000}`
  );
});
