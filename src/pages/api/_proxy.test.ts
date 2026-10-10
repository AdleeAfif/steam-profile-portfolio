import type { APIContext } from "astro";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  PROFILE_API_URL: "http://public.test:8080",
  PROFILE_API_ADMIN_URL: "http://admin.test:8081",
  PROFILE_API_KEY: "server-key",
  PROFILE_API_APP: "steam-portfolio",
  SITE_URL: "https://adlee.my",
  TRUST_CF_HEADERS: true,
  PUBLIC_GA_ID: undefined as string | undefined,
}));

vi.mock("astro:env/server", () => ({
  get PROFILE_API_URL() {
    return env.PROFILE_API_URL;
  },
  get PROFILE_API_ADMIN_URL() {
    return env.PROFILE_API_ADMIN_URL;
  },
  get PROFILE_API_KEY() {
    return env.PROFILE_API_KEY;
  },
  get PROFILE_API_APP() {
    return env.PROFILE_API_APP;
  },
  get SITE_URL() {
    return env.SITE_URL;
  },
  get TRUST_CF_HEADERS() {
    return env.TRUST_CF_HEADERS;
  },
  get PUBLIC_GA_ID() {
    return env.PUBLIC_GA_ID;
  },
}));

const { POST: postContact } = await import("./contact");
const { GET: getComments, POST: postComment } = await import("./comments");
const { ALL: adminProxy } = await import("./admin/[...path]");
const { onRequest } = await import("../../middleware");

interface Upstream {
  url: URL;
  method: string;
  headers: Headers;
  body: unknown;
}

let calls: Upstream[] = [];
let reply: () => Response | Promise<Response>;

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

beforeEach(() => {
  env.TRUST_CF_HEADERS = true;
  calls = [];
  reply = () => json({}, 201);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request | string | URL, init?: RequestInit) => {
      const request = input instanceof Request ? new Request(input, init) : new Request(String(input), init);
      const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
      calls.push({
        url: new URL(request.url),
        method: request.method,
        headers: request.headers,
        body: text ? JSON.parse(text) : null,
      });
      return reply();
    }),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function fakeCookies(token?: string) {
  const deleted: string[] = [];
  return {
    deleted,
    get: (name: string) => (token && name === "spp_admin" ? { value: token } : undefined),
    delete: (name: string) => deleted.push(name),
  };
}

function context(request: Request, extra: Partial<Record<string, unknown>> = {}): APIContext {
  return {
    request,
    url: new URL(request.url),
    clientAddress: "10.0.0.9",
    params: {},
    cookies: fakeCookies(),
    ...extra,
  } as unknown as APIContext;
}

function browserPost(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`https://adlee.my${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://adlee.my", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validMessage = { name: "Ada", email: "ada@example.com", message: "Hello there", website: "" };
const validComment = { name: "Ada", message: "Nice profile!", website: "" };

describe("POST /api/contact", () => {
  it("forwards to the messages endpoint with the server key and the Cloudflare client IP", async () => {
    reply = () => json({ id: "m1", createdAt: "2026-10-10T00:00:00Z" }, 201);
    const res = await postContact(context(browserPost("/api/contact", validMessage, { "CF-Connecting-IP": "203.0.113.7" })));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "m1", createdAt: "2026-10-10T00:00:00Z" });
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.method).toBe("POST");
    expect(call.url.href).toBe("http://public.test:8080/v1/apps/steam-portfolio/messages");
    expect(call.headers.get("X-API-Key")).toBe("server-key");
    expect(call.headers.get("X-Client-IP")).toBe("203.0.113.7");
    expect(call.body).toEqual(validMessage);
  });

  it("never forwards a browser-supplied X-Client-IP", async () => {
    await postContact(
      context(browserPost("/api/contact", validMessage, { "X-Client-IP": "6.6.6.6", "CF-Connecting-IP": "203.0.113.7" })),
    );
    expect(calls[0].headers.get("X-Client-IP")).toBe("203.0.113.7");

    calls = [];
    await postContact(context(browserPost("/api/contact", validMessage, { "X-Client-IP": "6.6.6.6" })));
    expect(calls[0].headers.get("X-Client-IP")).toBeNull();
  });

  it("ignores CF-Connecting-IP when Cloudflare headers are not trusted", async () => {
    env.TRUST_CF_HEADERS = false;
    await postContact(
      context(browserPost("/api/contact", validMessage, { "CF-Connecting-IP": "203.0.113.7", "X-Client-IP": "6.6.6.6" })),
    );
    expect(calls[0].headers.get("X-Client-IP")).toBe("10.0.0.9");
  });

  it("sends only schema fields and keeps the honeypot", async () => {
    await postContact(
      context(browserPost("/api/contact", { ...validMessage, website: "http://spam.example", admin: true, approved: true })),
    );
    expect(calls[0].body).toEqual({ ...validMessage, website: "http://spam.example" });
  });

  it("does not expose the API key in the response", async () => {
    const res = await postContact(context(browserPost("/api/contact", validMessage)));
    expect(JSON.stringify(Object.fromEntries(res.headers))).not.toContain("server-key");
    expect(await res.text()).not.toContain("server-key");
  });

  it("passes 400 validation details through", async () => {
    reply = () =>
      json(
        {
          error: {
            code: "validation_failed",
            message: "request validation failed",
            details: { email: "must be a valid email" },
          },
        },
        400,
      );
    const res = await postContact(context(browserPost("/api/contact", { ...validMessage, email: "nope" })));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: {
        code: "validation_failed",
        message: "request validation failed",
        details: { email: "must be a valid email" },
      },
    });
  });

  it("maps 429 to a friendly message and passes Retry-After on", async () => {
    reply = () => json({ error: { code: "rate_limited", message: "too many requests" } }, 429, { "Retry-After": "1500" });
    const res = await postContact(context(browserPost("/api/contact", validMessage)));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("1500");
    const body = (await res.json()) as { error: { code: string; message: string; retryAfter: number } };
    expect(body.error.code).toBe("rate_limited");
    expect(body.error.retryAfter).toBe(1500);
    expect(body.error.message).toContain("in about 25 minutes");
  });

  it("maps 429 without Retry-After", async () => {
    reply = () => json({ error: { code: "rate_limited", message: "too many requests" } }, 429);
    const res = await postContact(context(browserPost("/api/contact", validMessage)));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeNull();
    expect(((await res.json()) as { error: { message: string } }).error.message).toContain("in a little while");
  });

  it.each([
    ["503 from the API", () => json({ error: { code: "unavailable", message: "service temporarily unavailable" } }, 503)],
    ["500 from the API", () => json({ error: { code: "internal", message: "boom" } }, 500)],
    ["401 (server key rejected)", () => json({ error: { code: "unauthorized", message: "invalid key" } }, 401)],
    ["403", () => json({ error: { code: "forbidden", message: "origin not allowed" } }, 403)],
    ["404 (app or feature missing)", () => json({ error: { code: "not_found", message: "resource not found" } }, 404)],
  ])("maps %s to 503 without leaking upstream details", async (_label, upstream) => {
    reply = upstream;
    const res = await postContact(context(browserPost("/api/contact", validMessage)));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("unavailable");
    expect(body.error.message).not.toMatch(/boom|invalid key|origin/);
  });

  it("maps an unreachable API to 503", async () => {
    reply = () => {
      throw new TypeError("fetch failed");
    };
    const res = await postContact(context(browserPost("/api/contact", validMessage)));
    expect(res.status).toBe(503);
  });

  it("rejects bodies that are not a JSON object without calling the API", async () => {
    const res = await postContact(context(browserPost("/api/contact", "not json")));
    expect(res.status).toBe(400);
    const arr = await postContact(context(browserPost("/api/contact", "[1,2]")));
    expect(arr.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("rejects bodies over 16 KB without calling the API", async () => {
    const res = await postContact(context(browserPost("/api/contact", { ...validMessage, message: "x".repeat(17 * 1024) })));
    expect(res.status).toBe(413);
    expect(calls).toHaveLength(0);
  });
});

describe("/api/comments", () => {
  it("POST forwards to the comments endpoint with key, client IP and schema fields only", async () => {
    reply = () =>
      json(
        { id: "c1", app: "steam-portfolio", name: "Ada", message: "Nice profile!", approved: false, createdAt: "2026-10-10T00:00:00Z" },
        201,
      );
    const res = await postComment(
      context(
        browserPost(
          "/api/comments",
          { ...validComment, email: "x@example.com", approved: true },
          { "CF-Connecting-IP": "198.51.100.4", "X-Client-IP": "6.6.6.6" },
        ),
      ),
    );
    expect(res.status).toBe(201);
    const [call] = calls;
    expect(call.url.href).toBe("http://public.test:8080/v1/apps/steam-portfolio/comments");
    expect(call.headers.get("X-API-Key")).toBe("server-key");
    expect(call.headers.get("X-Client-IP")).toBe("198.51.100.4");
    expect(call.body).toEqual(validComment);
  });

  it("POST maps 429 with Retry-After", async () => {
    reply = () => json({ error: { code: "rate_limited", message: "too many requests" } }, 429, { "Retry-After": "30" });
    const res = await postComment(context(browserPost("/api/comments", validComment)));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(((await res.json()) as { error: { message: string } }).error.message).toContain("in 30 seconds");
  });

  it("GET passes cursor and limit through and sends no write credentials", async () => {
    reply = () => json({ items: [], nextCursor: "next" }, 200);
    const res = await getComments(
      context(new Request("https://adlee.my/api/comments?cursor=abc&limit=10", { headers: { "X-Client-IP": "6.6.6.6" } })),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], nextCursor: "next" });
    const [call] = calls;
    expect(call.method).toBe("GET");
    expect(call.url.pathname).toBe("/v1/apps/steam-portfolio/comments");
    expect(call.url.searchParams.get("cursor")).toBe("abc");
    expect(call.url.searchParams.get("limit")).toBe("10");
    expect(call.headers.get("X-API-Key")).toBeNull();
    expect(call.headers.get("X-Client-IP")).toBeNull();
  });

  it.each(["0", "101", "abc", "2.5"])("GET rejects limit=%s", async (limit) => {
    const res = await getComments(context(new Request(`https://adlee.my/api/comments?limit=${limit}`)));
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("GET maps 400 (bad cursor) and 503", async () => {
    reply = () => json({ error: { code: "bad_request", message: "invalid cursor" } }, 400);
    expect((await getComments(context(new Request("https://adlee.my/api/comments?cursor=bad")))).status).toBe(400);
    reply = () => json({ error: { code: "unavailable", message: "down" } }, 503);
    expect((await getComments(context(new Request("https://adlee.my/api/comments")))).status).toBe(503);
  });
});

describe("middleware", () => {
  const run = (request: Request) =>
    onRequest(context(request), async () => new Response("ok", { headers: { "Content-Type": "text/html" } })) as Promise<Response>;

  it("redirects www to the canonical host", async () => {
    const res = await run(new Request("https://www.adlee.my/games?x=1"));
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://adlee.my/games?x=1");
  });

  it.each([
    ["https://adlee.my", 200],
    ["https://www.adlee.my", 200],
    ["https://evil.example", 403],
    ["http://adlee.my", 403],
    [null, 403],
  ])("POST with Origin %s -> %s", async (origin, status) => {
    const headers: Record<string, string> = origin ? { Origin: origin } : {};
    const res = await run(new Request("https://adlee.my/api/contact", { method: "POST", headers, body: "{}" }));
    expect(res.status).toBe(status);
  });
});

describe("/api/admin/[...path]", () => {
  function adminRequest(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const request = new Request(`https://adlee.my/api/admin/${path}`, {
      method,
      headers: {
        Origin: "https://adlee.my",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return request;
  }

  it("requires the session cookie", async () => {
    const res = await adminProxy(context(adminRequest("GET", "summary"), { params: { path: "summary" } }));
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("forwards with the bearer token and the Cloudflare client IP, never the browser's", async () => {
    reply = () => json({ items: [] }, 200);
    const cookies = fakeCookies("tok-123");
    const res = await adminProxy(
      context(
        adminRequest("POST", "skills/reorder", { ids: ["go", "java"] }, { "CF-Connecting-IP": "203.0.113.9", "X-Client-IP": "6.6.6.6" }),
        { params: { path: "skills/reorder" }, cookies },
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const [call] = calls;
    expect(call.url.href).toBe("http://admin.test:8081/v1/admin/skills/reorder");
    expect(call.method).toBe("POST");
    expect(call.headers.get("Authorization")).toBe("Bearer tok-123");
    expect(call.headers.get("X-Client-IP")).toBe("203.0.113.9");
    expect(call.body).toEqual({ ids: ["go", "java"] });
  });

  it("drops a browser X-Client-IP when there is no Cloudflare header", async () => {
    reply = () => json({ items: [] }, 200);
    await adminProxy(
      context(adminRequest("GET", "summary", undefined, { "X-Client-IP": "6.6.6.6" }), {
        params: { path: "summary" },
        cookies: fakeCookies("tok"),
      }),
    );
    expect(calls[0].headers.get("X-Client-IP")).toBeNull();
  });

  it.each(["login", "logout", "skills/../login", "Skills", "a/b/c/d/e"])("refuses path %s", async (path) => {
    const res = await adminProxy(context(adminRequest("GET", path), { params: { path }, cookies: fakeCookies("tok") }));
    expect(res.status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it("clears the session cookie on 401", async () => {
    reply = () => json({ error: { code: "unauthorized", message: "authentication required" } }, 401);
    const cookies = fakeCookies("expired");
    const res = await adminProxy(context(adminRequest("GET", "me"), { params: { path: "me" }, cookies }));
    expect(res.status).toBe(401);
    expect(cookies.deleted).toContain("spp_admin");
  });

  it("passes 400 validation details through unchanged", async () => {
    const error = { error: { code: "validation_failed", message: "request validation failed", details: { ids: "is required" } } };
    reply = () => json(error, 400);
    const res = await adminProxy(
      context(adminRequest("POST", "skills/reorder", { ids: [] }), { params: { path: "skills/reorder" }, cookies: fakeCookies("tok") }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(error);
  });

  it("maps an unreachable admin API to 503", async () => {
    reply = () => {
      throw new TypeError("fetch failed");
    };
    const res = await adminProxy(context(adminRequest("GET", "me"), { params: { path: "me" }, cookies: fakeCookies("tok") }));
    expect(res.status).toBe(503);
  });

  it("requires JSON bodies", async () => {
    const request = new Request("https://adlee.my/api/admin/skills/reorder", {
      method: "POST",
      headers: { Origin: "https://adlee.my", "Content-Type": "text/plain" },
      body: "ids=go",
    });
    const res = await adminProxy(context(request, { params: { path: "skills/reorder" }, cookies: fakeCookies("tok") }));
    expect(res.status).toBe(415);
    expect(calls).toHaveLength(0);
  });
});
