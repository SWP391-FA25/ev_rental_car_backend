import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { getCorsOptions } from './config/cors.js';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(helmet());
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/docs.json', (req, res) => res.json(openapiSpec));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
