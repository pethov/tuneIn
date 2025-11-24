import { getOrCreateUserId } from '../lib/userId'

type GraphQLResponse<TData> = {
  data?: TData
  errors?: Array<{ message?: string }>
}

export async function graphqlFetch<
  TData,
  TVars extends Record<string, unknown> = Record<string, never>,
>(
  query: string,
  variables?: TVars,
  opts?: { endpoint?: string; signal?: AbortSignal }
): Promise<TData> {
  const defaultEndpoint =
    typeof window !== 'undefined'
      ? `${window.location.origin}/graphql`
      : 'http://localhost:3001/graphql'

  const endpoint = opts?.endpoint ?? import.meta.env.VITE_GRAPHQL_URL ?? defaultEndpoint

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getOrCreateUserId(),
    },
    body: JSON.stringify({ query, variables }),
    signal: opts?.signal,
  })

  const fallback: GraphQLResponse<TData> = {}
  const json = (await res.json().catch(() => fallback)) as GraphQLResponse<TData>
  const messageFromResponse = json.errors?.[0]?.message

  if (!res.ok) {
    throw new Error(messageFromResponse ?? `GraphQL HTTP ${res.status}`)
  }
  if (json.errors?.length) {
    throw new Error(messageFromResponse ?? 'GraphQL error')
  }
  if (!json.data) {
    throw new Error('GraphQL response missing data')
  }
  return json.data
}
