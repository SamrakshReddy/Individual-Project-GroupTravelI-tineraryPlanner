import env from './env.js';

export const corsConfig = {
  origin: env.corsOrigin,
  credentials: true,
};
