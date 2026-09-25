export interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
  GOOGLE_MAPS_API_KEY?: string;
  VITE_GOOGLE_MAPS_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        message: 'Worker is running',
      });
    }

    if (url.pathname === '/api/config') {
      return Response.json({
        googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY || '',
      });
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        return await env.ASSETS.fetch(new Request(new URL('/', request.url).toString(), request));
      }
      return response;
    } catch (err: unknown) {
      try {
        return await env.ASSETS.fetch(new Request(new URL('/', request.url).toString(), request));
      } catch (fallbackErr: unknown) {
        const msg = err instanceof Error ? err.stack || err.message : String(err);
        return new Response(`Worker caught error: ${msg}`, { status: 500 });
      }
    }
  },
};
