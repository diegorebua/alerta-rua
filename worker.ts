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

    // Encaminha requisições estáticas para o motor de assets da Cloudflare
    return env.ASSETS.fetch(request);
  },
};
