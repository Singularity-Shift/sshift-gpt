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
    openApi: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    storage: {
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY,
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    },
    eleven: {
      url: process.env.ELEVENLABS_URL,
      apiKey: process.env.ELVEN_API_KEY,
    },
    indexer: {
      url: process.env.INDEXER_URL,
      apiKey: process.env.INDEXER_API_KEY,
      userId: process.env.INDEXER_USER_ID,
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
    openApi: {
      apiKey: process.env.OPENAPI_API_KEY,
    },
    storage: {
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY,
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    },
    eleven: {
      url: process.env.ELEVENLABS_URL,
      apiKey: process.env.ELVEN_API_KEY,
    },
    indexer: {
      url: process.env.INDEXER_URL,
      apiKey: process.env.INDEXER_API_KEY,
      userId: process.env.INDEXER_USER_ID,
    },
  },
};
