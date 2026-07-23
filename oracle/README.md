# Oracle

Oracle is the AI knowledge platform for the Syntarion ecosystem.

It is a standalone app, not a Syntarion panel and not a chatbot. Oracle preserves uploaded sources, builds searchable knowledge, supports writing, prepares atlas data, and reads Syntarion state through authenticated APIs.

## Stack

- React
- TypeScript
- Vite
- Node/Vercel API routes
- Supabase Auth, PostgreSQL, Storage, and pgvector

## App Systems

- Brain: document ingestion, chunks, embeddings, entities, facts, relationships, conflicts, source references, approval queue
- Scribe: outlining, editing, summarization, consistency checks, citation-aware writing
- Atlas: tiled maps, pins, notes, regions, routes, measurement-ready structured geography
- Integration Layer: read-only Syntarion API consumers for live gameplay state

## Canon Rule

No AI-generated fact becomes canon automatically. AI-generated updates are stored as proposals and must be approved through `oracle_approval_queue`.

## Environment

Copy `.env.example` to `.env.local` and fill in the Supabase, OpenAI, and Syntarion API values.

## Development

```bash
npm install
npm run dev
```

## Database

Run `supabase/migrations/20260723_oracle_foundation.sql` against the Oracle Supabase project. Create a private Supabase Storage bucket named `oracle-documents` for uploaded sources.
