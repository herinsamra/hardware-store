export const CACHE_CONTROL = {
  catalogData: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  noStore: 'no-store, max-age=0',
};

export function jsonHeaders(cacheControl = CACHE_CONTROL.noStore) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheControl,
  };
}

export function jsonResponse(body, init = {}, cacheControl = CACHE_CONTROL.noStore) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders(cacheControl),
      ...init.headers,
    },
  });
}
