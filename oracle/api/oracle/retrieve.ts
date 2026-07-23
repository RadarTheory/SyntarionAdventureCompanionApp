import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } },
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const query = String(req.body?.query || '').trim();
  if (!query) {
    res.status(400).json({ error: 'A query is required.' });
    return;
  }

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const { data, error } = await supabase.rpc('oracle_match_chunks', {
    query_embedding: embedding.data[0].embedding,
    match_count: 8,
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({
    query,
    results: data,
    rule: 'Evidence retrieved before generation. Canon changes must enter approval_queue.',
  });
}
