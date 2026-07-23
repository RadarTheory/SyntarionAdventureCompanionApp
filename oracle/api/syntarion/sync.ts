import type { VercelRequest, VercelResponse } from '@vercel/node';

const domains = ['characters', 'campaigns', 'combat', 'story-events', 'quests', 'relationships', 'grimoire', 'journals'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const domain = String(req.body?.domain || '');
  if (!domains.includes(domain)) {
    res.status(400).json({ error: 'Unsupported Syntarion domain.' });
    return;
  }

  if (!process.env.SYNTARION_API_BASE_URL || !process.env.SYNTARION_API_TOKEN) {
    res.status(501).json({
      error: 'Syntarion API credentials are not configured.',
      boundary: 'Oracle reads live gameplay state but does not edit Syntarion directly.',
    });
    return;
  }

  const upstream = await fetch(`${process.env.SYNTARION_API_BASE_URL}/${domain}`, {
    headers: {
      Authorization: `Bearer ${process.env.SYNTARION_API_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!upstream.ok) {
    res.status(upstream.status).json({ error: `Syntarion request failed for ${domain}.` });
    return;
  }

  const data = await upstream.json();
  res.status(200).json({
    domain,
    source: 'syntarion',
    mode: 'read-only',
    data,
  });
}
