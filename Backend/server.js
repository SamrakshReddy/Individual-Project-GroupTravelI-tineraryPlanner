import './config/env.js';
import exp from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import xssClean from 'xss-clean';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import { corsConfig } from './config/corsConfig.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import authAPI from './APIs/authAPI.js';
import tripAPI from './APIs/tripAPI.js';
import expenseAPI from './APIs/expenseAPI.js';
import activityAPI from './APIs/activityAPI.js';
import dashboardAPI from './APIs/dashboardAPI.js';
import recommendationAPI from './APIs/recommendationAPI.js';
import userAPI from './APIs/userAPI.js';
import aiAPI from './APIs/aiAPI.js';
import notificationAPI from './APIs/notificationAPI.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';
import { ensureCoversUploadDir } from './utils/localImageStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = exp();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsConfig));
app.use(exp.json({ limit: '1mb' }));
app.use(exp.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(rateLimiter);
app.use(morgan(env.env === 'production' ? 'combined' : 'dev'));
app.use('/uploads', exp.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authAPI);
app.use('/api/trips', tripAPI);
app.use('/api/expenses', expenseAPI);
app.use('/api/activities', activityAPI);
app.use('/api/dashboard', dashboardAPI);
app.use('/api/recommendations', recommendationAPI);
app.use('/api/meta', userAPI);
app.use('/api/ai', aiAPI);
app.use('/api/notifications', notificationAPI);

app.use(notFound);
app.use(errorHandler);

if (process.argv[1]?.endsWith('server.js')) {
  connectDB()
    .then(async () => {
      await ensureCoversUploadDir();
      app.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
        console.log(
          isCloudinaryConfigured()
            ? 'Cover image uploads: Cloudinary'
            : `Cover image uploads: local storage (${env.publicBaseUrl}/uploads)`,
        );
      });
    })
    .catch((error) => {
      console.error('MongoDB connection failed', error);
      process.exit(1);
    });
}

export default app;
