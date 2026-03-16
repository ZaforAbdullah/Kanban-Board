import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
});

// Attach JWT token from localStorage to every request
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kanban_token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Global error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const { message, extensions } of graphQLErrors) {
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Token expired or invalid — clear storage and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kanban_token');
          localStorage.removeItem('kanban_user');
          window.location.href = '/login';
        }
      } else if (extensions?.code !== 'NOT_FOUND') {
        console.error(`[GraphQL error]: ${message}`);
      }
    }
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Board: {
        fields: {
          columns: { merge: false },
        },
      },
      Column: {
        fields: {
          tasks: { merge: false },
        },
      },
      Task: {
        fields: {
          subtasks: { merge: false },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});
