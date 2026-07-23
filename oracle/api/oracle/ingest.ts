import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

  const { documentId, versionId, text } = req.body || {};
  if (!documentId || !versionId || typeof text !== 'string') {
    res.status(400).json({ error: 'documentId, versionId, and text are required.' });
    return;
  }

  const chunks = chunkText(text).map((content, index) => ({
    document_id: documentId,
    version_id: versionId,
    chunk_index: index,
    content,
    token_count: Math.ceil(content.length / 4),
  }));

  const { error } = await supabase.from('oracle_chunks').insert(chunks);
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await supabase
    .from('oracle_documents')
    .update({ status: 'chunked', updated_at: new Date().toISOString() })
    .eq('id', documentId);

  res.status(200).json({ inserted: chunks.length });
}

function chunkText(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const size = 1800;
  const overlap = 220;
  const chunks: string[] = [];

  for (let start = 0; start < normalized.length; start += size - overlap) {
    chunks.push(normalized.slice(start, start + size));
  }

  return chunks.filter(Boolean);
}
