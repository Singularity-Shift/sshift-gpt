import { ApolloClient, InMemoryCache } from '@apollo/client';
import { createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { ApolloLink } from '@apollo/client';

// Create the http link
const httpLink = createHttpLink({
    uri: 'https://api.indexer.xyz/graphql',
});

// Add the auth link
const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            'x-api-user': process.env.INDEXER_USER_ID,
            'x-api-key': process.env.INDEXER_API_KEY,
        }
    };
});

// Create a logging link
const loggingLink = new ApolloLink((operation, forward) => {
    const startTime = Date.now();
    
    return forward(operation).map(response => {
        const endTime = Date.now();
        const requestTime = endTime - startTime;
        
        console.log('\x1b[36m%s\x1b[0m', '[Indexer Client]'); // Cyan color
        console.log(`Operation: ${operation.operationName}`);
        console.log(`Time: ${requestTime}ms`);
        console.log('----------------------------------------');
        
        return response;
    });
});

// Configure cache with proper IDs and field policies
const cache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                aptos: {
                    merge(existing, incoming) {
                        return incoming;
                    }
                }
            }
        },
        Collection: {
            keyFields: ['id'],
            fields: {
                floor: {
                    read(floor) {
                        return floor ? floor * Math.pow(10, -8) : null;
                    }
                },
                volume: {
                    read(volume) {
                        return volume ? volume * Math.pow(10, -8) : null;
                    }
                }
            }
        },
        CollectionStats: {
            keyFields: ['id'],
            fields: {
                total_volume: {
                    read(volume) {
                        return volume ? volume * Math.pow(10, -8) : null;
                    }
                },
                day_volume: {
                    read(volume) {
                        return volume ? volume * Math.pow(10, -8) : null;
                    }
                }
            }
        }
    },
    possibleTypes: {
        Collection: ['collections'],
        CollectionStats: ['collection_stats']
    }
});

// Create the Apollo Client instance
const indexerClient = new ApolloClient({
    link: ApolloLink.from([loggingLink, authLink.concat(httpLink)]),
    cache,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'no-cache' // Disable caching for queries
        },
        query: {
            fetchPolicy: 'no-cache' // Disable caching for queries
        }
    }
});

export default indexerClient;
