export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const usd = (n: number) =>
  n === 0 ? "$0" : n < 0.01 ? "<$0.01" : `$${n.toFixed(2)}`;

/** Trims trailing zeros from a decimal token amount. */
export const amount = (s: string) => (s.includes(".") ? s.replace(/\.?0+$/, "") : s);

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}
