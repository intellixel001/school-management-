// ── Request coalescing ────────────────────────────────────────────────────────
// Teacher-portal reads were being fetched several times per page load: the page
// and the nav badge in TeacherLayoutShell ask for the same data independently,
// getPendingStudents() re-reads the same list getStudents() just fetched, and
// React StrictMode double-runs every effect in dev. On a slow backend that
// stacked into ~10 s of redundant requests.
//
// `coalesce` fixes it at the service layer so call sites stay unchanged:
//   - concurrent callers share ONE in-flight request
//   - the result is held briefly, so a single page load costs one round trip
//
// BROWSER ONLY. Module state on the server is shared across every request in
// the Node process, so caching there risks serving one request's data to
// another. Server Components fall straight through to the fetcher.

const DEFAULT_TTL_MS = 5_000

interface Entry<T> { data: T; at: number }

const cache    = new Map<string, Entry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

/**
 * Share one request per `key` between concurrent callers and reuse its result
 * for `ttlMs`. Rejections are never cached — a failed call is retried next time.
 */
export function coalesce<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  if (typeof window === 'undefined') return fetcher()

  const hit = cache.get(key) as Entry<T> | undefined
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.data)

  const pending = inFlight.get(key) as Promise<T> | undefined
  if (pending) return pending

  const request = fetcher()
    .then(data => {
      cache.set(key, { data, at: Date.now() })
      return data
    })
    .finally(() => { inFlight.delete(key) })

  inFlight.set(key, request)
  return request
}

/**
 * Drop cached entries. Pass a key prefix to clear one family (e.g. 'students'),
 * or nothing to clear everything. Call after any mutation that invalidates a
 * cached read — in-flight requests are left alone and simply won't be cached.
 */
export function invalidateCache(prefix?: string): void {
  if (prefix === undefined) {
    cache.clear()
    return
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
