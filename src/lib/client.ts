// Browser-side helpers.

export async function postJson<T = { ok: true }>(
  url: string,
  body: unknown,
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return { data: json as T };
  } catch {
    return { error: "Can't reach the server. Check your connection." };
  }
}

// localStorage can throw (private mode, blocked storage), so every access is guarded.
const key = (slug: string) => `waitlist:${slug}`;
export const savedToken = {
  get(slug: string) {
    try {
      return localStorage.getItem(key(slug));
    } catch {
      return null;
    }
  },
  set(slug: string, token: string) {
    try {
      localStorage.setItem(key(slug), token);
    } catch {}
  },
  clear(slug: string) {
    try {
      localStorage.removeItem(key(slug));
    } catch {}
  },
};
