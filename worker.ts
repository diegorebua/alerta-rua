export interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
  GOOGLE_MAPS_API_KEY?: string;
  VITE_GOOGLE_MAPS_API_KEY?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  VITE_CLERK_PUBLISHABLE_KEY?: string;
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
        clerkPublishableKey: env.VITE_CLERK_PUBLISHABLE_KEY || env.CLERK_PUBLISHABLE_KEY || '',
      });
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ error: 'Not Found' }, { status: 404 });
    }

    // Encaminha requisições estáticas e rotas SPA para o motor de assets
    return env.ASSETS.fetch(request);
  },
};
