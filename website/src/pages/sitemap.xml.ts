import type { APIRoute } from 'astro';
import { loadCatalog } from '../lib/catalog.mjs';

export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/events/', '/archive/', ...loadCatalog().presentations.map((talk) => `/presentations/${talk.id}/`)];
  const urls = site ? paths.map((pathname) => `<url><loc>${new URL(pathname, site).href.replace(/&/g, '&amp;')}</loc></url>`).join('') : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
};