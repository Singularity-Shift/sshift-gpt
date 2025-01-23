import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ConfigService } from '../config/config.service';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';

const httpLink = (configService: ConfigService) =>
  createHttpLink({
    uri: configService.get('indexer.url'),
  });

const authLink = (configService: ConfigService) =>
  setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        'x-api-user': configService.get('indexer.userId'),
        'x-api-key': configService.get('indexer.apiKey'),
      },
    };
  });

const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();

  return forward(operation).map((response) => {
    const endTime = Date.now();
    const requestTime = endTime - startTime;

    const logger = new Logger(ApolloClient.name);
    logger.log('\x1b[36m%s\x1b[0m', '[Indexer Client]'); // Cyan color
    logger.log(`Operation: ${operation.operationName}`);
    logger.log(`Time: ${requestTime}ms`);
    logger.log('----------------------------------------');

    return response;
  });
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        aptos: {
          merge(_, incoming) {
            return incoming;
          },
        },
      },
    },
    Collection: {
      keyFields: ['id'],
      fields: {
        floor: {
          read(floor) {
            return floor ? floor * Math.pow(10, -8) : null;
          },
        },
        volume: {
          read(volume) {
            return volume ? volume * Math.pow(10, -8) : null;
          },
        },
      },
    },
    CollectionStats: {
      keyFields: ['id'],
      fields: {
        total_volume: {
          read(volume) {
            return volume ? volume * Math.pow(10, -8) : null;
          },
        },
        day_volume: {
          read(volume) {
            return volume ? volume * Math.pow(10, -8) : null;
          },
        },
      },
    },
  },
  possibleTypes: {
    Collection: ['collections'],
    CollectionStats: ['collection_stats'],
  },
});

export const indexerProvider = {
  provide: ApolloClient,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new ApolloClient({
      link: ApolloLink.from([
        loggingLink,
        authLink(configService).concat(httpLink(configService)),
      ]),
      cache,
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'no-cache', // Disable caching for queries
        },
        query: {
          fetchPolicy: 'no-cache', // Disable caching for queries
        },
      },
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [indexerProvider],
  exports: [ApolloClient],
})
export class IndexerModule {}
