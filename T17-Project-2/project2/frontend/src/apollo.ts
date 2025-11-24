import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'
import { getOrCreateUserId } from './lib/userId'

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    )
  if (networkError) console.log(`[Network error]: ${networkError}`)
})

const defaultUri =
  typeof window !== 'undefined'
    ? `${window.location.origin}/graphql`
    : 'http://localhost:3001/graphql'

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? defaultUri,
  credentials: 'same-origin',
})

const authLink = setContext((_, { headers }) => {
  const userId = getOrCreateUserId()
  return {
    headers: {
      ...headers,
      'x-user-id': userId,
      'x-anon-id': userId,
      'Content-Type': 'application/json',
    },
  }
})

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          playlists: {
            keyArgs: false,
            merge(_existing, incoming) {
              return incoming ?? []
            },
          },
        },
      },
      Playlist: { keyFields: ['playlistId'] },
      Track: { keyFields: ['trackId'] },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  },
})
