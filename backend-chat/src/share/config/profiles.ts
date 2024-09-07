export const Profiles = {
  development: {
    nodeEnv: process.env.NODE_ENV,
    mongo: {
      uri: process.env.MONGO_URI,
    },
    redis: {
      pwd: process.env.REDIS_PWD,
      host: process.env.HOST,
      port: process.env.PORT,
    },
    server: {
      port: process.env.PORT,
    },
  },
  production: {
    nodeEnv: process.env.NODE_ENV,
    mongo: {
      uri: process.env.URI,
    },
    redis: {
      pwd: process.env.REDIS_PWD,
      host: process.env.HOST,
      port: process.env.PORT,
    },
    server: {
      port: process.env.PORT,
    },
  },
};
