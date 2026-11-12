/**
 * sofievp.com — Cloudflare Worker
 *
 * Adds two agent-readiness features Render's static origin can't do:
 *   1) RFC 8288 `Link` response headers (sitemap, llms.txt, hreflang alternates)
 *      — a safety net in case render.yaml headers don't apply.
 *   2) Markdown content negotiation: when a request carries
 *      `Accept: text/markdown`, the worker rewrites the request to the matching
 *      .md file under the origin and sets `Content-Type: text/markdown; charset=utf-8`,
 *      `Vary: Accept`, `X-Markdown-Tokens: <len>`. Browsers (which don't send that
 *      Accept) keep the HTML.
 *
 * Deploy
 * ------
 * - Repo has the Cloudflare Workers GitHub app installed (handbook §2).
 * - In Cloudflare dashboard → Workers → create "sofievp-agent" → paste this file
 *   → set the route `sofievp.com/*` to this worker.
 * - No KV / no secrets required; the worker only touches request/response headers.
 */

const ORIGIN = 'https://sofievp.onrender.com';

const BASE_LINKS = [
  '<https://sofievp.com/sitemap.xml>; rel="sitemap"; type="application/xml"',
  '<https://sofievp.com/robots.txt>; rel="robots"; type="text/plain"',
];

const HREFLANG_LINKS = [
  '<https://sofievp.com/ru/>; rel="alternate"; hreflang="ru"',
  '<https://sofievp.com/en/>; rel="alternate"; hreflang="en"',
  '<https://sofievp.com/cz/>; rel="alternate"; hreflang="cs"',
  '<https://sofievp.com/ru/>; rel="alternate"; hreflang="x-default"',
];

function llmsLink(pathname) {
  if (pathname.startsWith('/ru/') || pathname === '/guide-5-analizov.html' || pathname === '/llms.ru.txt') {
    return '<https://sofievp.com/llms.ru.txt>; rel="llms"; type="text/markdown"';
  }
  if (pathname.startsWith('/cz/')) {
    return '<https://sofievp.com/llms.cz.txt>; rel="llms"; type="text/markdown"';
  }
  return '<https://sofievp.com/llms.txt>; rel="llms"; type="text/markdown"';
}

function wantsMarkdown(request) {
  const accept = (request.headers.get('Accept') || '').toLowerCase();
  if (!accept) return false;
  // Browsers send text/html first; only redirect to markdown when the client
  // explicitly prefers markdown over HTML.
  const mdIdx = accept.indexOf('text/markdown');
  const htmlIdx = accept.indexOf('text/html');
  if (mdIdx === -1) return false;
  if (htmlIdx === -1) return true;
  return mdIdx < htmlIdx;
}

function mdPathFor(pathname) {
  if (pathname === '/' || pathname === '') return '/llms.txt';
  if (pathname === '/ru/' || pathname === '/ru/index.html') return '/llms.ru.txt';
  if (pathname === '/en/' || pathname === '/en/index.html') return '/llms.txt';
  if (pathname === '/cz/' || pathname === '/cz/index.html') return '/llms.cz.txt';

  // Strip trailing slash → index.md, else swap .html for .md
  let target = pathname;
  if (target.endsWith('/')) target = target + 'index.md';
  else if (target.endsWith('.html')) target = target.slice(0, -5) + '.md';
  else if (!target.includes('.')) target = target + '.md';
  return target;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Markdown negotiation: return matching .md file if the client prefers it.
    if (wantsMarkdown(request) && !pathname.endsWith('.md') && !pathname.endsWith('.txt')) {
      const mdPath = mdPathFor(pathname);
      const mdURL = new URL(mdPath, ORIGIN).toString();
      const mdResp = await fetch(mdURL, {
        method: request.method,
        headers: request.headers,
      });
      if (mdResp.status === 200) {
        const body = await mdResp.text();
        const tokens = Math.ceil(body.length / 4); // rough token estimate
        const resp = new Response(body, mdResp);
        resp.headers.set('Content-Type', 'text/markdown; charset=utf-8');
        resp.headers.set('Vary', 'Accept, Accept-Encoding');
        resp.headers.set('X-Markdown-Tokens', String(tokens));
        resp.headers.set('X-Markdown-Source', mdPath);
        setLinkHeaders(resp, pathname);
        setSecurityHeaders(resp);
        return resp;
      }
      // Fall through to HTML if .md is missing
    }

    // Plain HTML path — pass through, add Link + security headers
    const upstream = await fetch(request);
    const resp = new Response(upstream.body, upstream);
    const ct = (resp.headers.get('Content-Type') || '').toLowerCase();
    setLinkHeaders(resp, pathname);
    setSecurityHeaders(resp);
    if (ct.includes('text/html')) {
      const existing = resp.headers.get('Vary') || '';
      const merged = mergeVary(existing, 'Accept, Accept-Encoding');
      resp.headers.set('Vary', merged);
    }
    return resp;
  },
};

function setLinkHeaders(resp, pathname) {
  const links = BASE_LINKS.concat(HREFLANG_LINKS).concat([llmsLink(pathname)]);
  const existing = resp.headers.get('Link');
  const merged = existing ? existing + ', ' + links.join(', ') : links.join(', ');
  resp.headers.set('Link', merged);
}

function setSecurityHeaders(resp) {
  resp.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  resp.headers.set('X-Content-Type-Options', 'nosniff');
  resp.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  resp.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  resp.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  resp.headers.set('X-Frame-Options', 'DENY');
  if (!resp.headers.get('Content-Security-Policy')) {
    resp.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://sofievp.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://sofievp-api.onrender.com https://www.google-analytics.com https://region1.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://sofievp-api.onrender.com"
    );
  }
}

function mergeVary(existing, extra) {
  const parts = new Set(
    (existing + ',' + extra)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );
  return Array.from(parts).join(', ');
}
