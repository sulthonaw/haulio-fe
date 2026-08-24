/**
 * Same-origin bridge between the browser-facing Next app and the DS/BE service.
 *
 * Keeping the bridge server-side means browser code never needs access to the
 * backend host configuration or the Google Routes key used by the DS service.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const FORWARDED_REQUEST_HEADERS = ["accept", "content-type"] as const;
const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control"] as const;

async function proxy(request: Request, { params }: RouteContext): Promise<Response> {
  const { path } = await params;
  const backendBase = process.env.BACKEND_URL ?? "http://127.0.0.1:8080";

  let upstreamUrl: URL;
  try {
    const safePath = path.map((segment) => encodeURIComponent(segment)).join("/");
    upstreamUrl = new URL(`/api/v1/${safePath}`, backendBase);
    upstreamUrl.search = new URL(request.url).search;
  } catch {
    return Response.json({ error: "BACKEND_URL is not a valid URL" }, { status: 500 });
  }

  const headers = new Headers();
  for (const header of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  try {
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    for (const header of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }
    responseHeaders.set("cache-control", "no-store");
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { error: "Operations gateway is unavailable. Start haulio-be on port 3001 and the DS service on port 8080." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
