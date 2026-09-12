/// Minimal JSON fetch helper.

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; ScrapedDuck/1.0)" },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // An HTML error page served with HTTP 200 must throw, not parse to [].
    throw new Error(`${url} -> body is not JSON`);
  }
}
