export const Profiles = {
  development: {
    nodeEnv: process.env.NODE_ENV,
    mongo: {
      uri: process.env.MONGO_URI,
    },
    redis: {
      pwd: process.env.REDIS_PWD,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    server: {
      port: process.env.PORT,
    },
    jwt: {
      secret: process.env.JWT_SECRET_KEY,
      expiredTime: process.env.JWT_EXPIRED_TIME,
    },
  },
  production: {
    nodeEnv: process.env.NODE_ENV,
    mongo: {
      uri: process.env.MONGO_URI,
    },
    redis: {
      pwd: process.env.REDIS_PWD,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    server: {
      port: process.env.PORT,
    },
    jwt: {
      secret: process.env.JWT_SECRET_KEY,
      expiredTime: process.env.JWT_EXPIRED_TIME,
    },
  },
};
