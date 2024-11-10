import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
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

// Create the Apollo Client instance
const indexerClient = new ApolloClient({
    link: ApolloLink.from([loggingLink, authLink.concat(httpLink)]),
    cache: new InMemoryCache(),
});

export default indexerClient;
