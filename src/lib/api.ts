import { NextResponse } from "next/server";
import type { z } from "zod";
import { HttpError } from "./queue";
import { isHostOf } from "./auth";

/** Wraps a route handler: parses the JSON body with `schema`, turns errors into JSON responses. */
export function route<S extends z.ZodTypeAny, P>(
  schema: S,
  handler: (body: z.infer<S>, params: P) => Promise<unknown>,
  opts: { host?: boolean } = {},
) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    try {
      const params = await ctx.params;
      const slug = (params as { slug?: string }).slug;
      if (opts.host && !(slug && (await isHostOf(slug)))) {
        throw new HttpError(401, "Please log in as host");
      }
      const parsed = schema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
      }
      const result = await handler(parsed.data, params);
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

/** Builds a Server-Sent Events response that calls `push(send)` now, on every change, and every 30s. */
export function sseResponse(
  req: Request,
  push: (send: (event: string, data: unknown) => void) => Promise<void>,
  onChange: (listener: () => void) => () => void,
) {
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (!closed) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const refresh = () => push(send).catch((e) => console.error("stream refresh failed", e));
      await refresh();
      const off = onChange(refresh);
      // Periodic refresh keeps "minutes waited" fresh and doubles as a keep-alive.
      const timer = setInterval(refresh, 30_000);
      cleanup = () => {
        if (closed) return;
        closed = true;
        off();
        clearInterval(timer);
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
