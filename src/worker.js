/* jerica.pro — static site. The old message board has been retired. */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return new Response('Gone', { status: 410, headers: { 'cache-control': 'no-store' } });
    return env.ASSETS.fetch(req);
  },
};
