import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { getCorsOptions } from './config/cors.js';

const app = express();

app.use(helmet());
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
