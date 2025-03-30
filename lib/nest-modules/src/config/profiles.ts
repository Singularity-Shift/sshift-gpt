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
    serverChatApi: {
      port: process.env.PORT_CHAT,
    },
    serverToolsApi: {
      uri: process.env.URI_TOOLS,
      port: process.env.PORT_TOOLS,
    },
    jwt: {
      secret: process.env.JWT_SECRET_KEY,
      expiredTime: process.env.JWT_EXPIRED_TIME,
    },
    openApi: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    storage: {
      project_id: process.env.PROJECT_ID,
      storageCredentials: process.env.STORAGE_CREDENTIALS,
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
    cmc: {
      apiKey: process.env.CMC_API_KEY,
      baseUrl: process.env.CMC_BASE_URL,
    },
    wiki: {
      url: process.env.WIKI_URL,
    },
    arxiv: {
      url: process.env.ARXIV_URL,
    },
    handleFinder: {
      apiKey: process.env.HANDLE_FINDER_API_KEY,
      baseUrl: process.env.HANDLE_FINDER_BASE_URL,
      address: process.env.HANDLE_FINDER_ADDRESS,
    },
    elfa: {
      apiKey: process.env.ELFA_API_KEY,
      baseUrl: process.env.ELFA_BASE_URL,
    },
    ideogram: {
      apiKey: process.env.IDEOGRAM_API_KEY,
      baseUrl: process.env.IDEOGRAM_BASE_URL,
    },
    langchain: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    panora: {
      apiKey: process.env.PANORA_API_KEY,
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
    serverChatApi: {
      port: process.env.PORT_CHAT,
    },
    serverToolsApi: {
      uri: process.env.URI_TOOLS,
      port: process.env.PORT_TOOLS,
    },
    jwt: {
      secret: process.env.JWT_SECRET_KEY,
      expiredTime: process.env.JWT_EXPIRED_TIME,
    },
    openApi: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    storage: {
      project_id: process.env.PROJECT_ID,
      storageCredentials: process.env.STORAGE_CREDENTIALS,
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
    cmc: {
      apiKey: process.env.CMC_API_KEY,
      baseUrl: process.env.CMC_BASE_URL,
    },
    wiki: {
      url: process.env.WIKI_URL,
    },
    arxiv: {
      url: process.env.ARXIV_URL,
    },
    handleFinder: {
      apiKey: process.env.HANDLE_FINDER_API_KEY,
      baseUrl: process.env.HANDLE_FINDER_BASE_URL,
      address: process.env.HANDLE_FINDER_ADDRESS,
    },
    elfa: {
      apiKey: process.env.ELFA_API_KEY,
      baseUrl: process.env.ELFA_BASE_URL,
    },
    ideogram: {
      apiKey: process.env.IDEOGRAM_API_KEY,
      baseUrl: process.env.IDEOGRAM_BASE_URL,
    },
    langchain: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    panora: {
      apiKey: process.env.PANORA_API_KEY,
    },
  },
};
