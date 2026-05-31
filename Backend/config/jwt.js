import env from './env.js';

export const jwtConfig = {
  accessSecret: env.jwtSecret,
  refreshSecret: env.jwtRefreshSecret,
  accessExpiresIn: env.accessTokenTtl,
  refreshExpiresIn: env.refreshTokenTtl,
};
