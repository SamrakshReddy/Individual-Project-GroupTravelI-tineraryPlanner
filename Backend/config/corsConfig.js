import env from './env.js';

const parseAllowedOrigins = (corsOrigin) => {
  if (!corsOrigin) return '*';
  if (corsOrigin.includes(',')) {
    return corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  return corsOrigin;
};

export const corsConfig = {
  origin: parseAllowedOrigins(env.corsOrigin),
  credentials: true,
};
