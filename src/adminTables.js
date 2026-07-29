// Registry of admin-browsable tables, grouped by product and category.
// Oracle lives in a separate repo but shares this same Supabase project
// (see oracle/README.md — "Oracle should use the same Supabase project as Syntarion"),
// so its tables are reachable through the same admin session/RLS.

export const TABLE_GROUPS = [
  {
    id: 'syntarion',
    label: 'Syntarion',
    categories: [
      { label: 'World & Campaigns', tables: ['campaigns', 'modules', 'npcs', 'beasts', 'grimoire_entries', 'larks', 'world_clock'] },
      { label: 'Characters & Items', tables: ['characters', 'character_items', 'items', 'npc_inventory'] },
      { label: 'Economy', tables: ['trades', 'trade_items', 'lootboxes', 'lootbox_items'] },
      { label: 'Sessions & Combat', tables: ['sessions', 'session_checkins', 'session_logs', 'vtt_sessions', 'hercules_sessions', 'hercules_events', 'hercules_initiative'] },
      { label: 'Messages & Support', tables: ['messages', 'support_reports', 'legal_acceptances'] },
      { label: 'DM Tools', tables: ['dm_memory', 'scribe_context'] },
    ],
  },
  {
    id: 'oracle',
    label: 'Oracle',
    categories: [
      { label: 'Brain', tables: ['oracle_documents', 'oracle_document_versions', 'oracle_chunks', 'oracle_embeddings', 'oracle_entities', 'oracle_facts', 'oracle_relationships', 'oracle_source_references', 'oracle_conflicts'] },
      { label: 'Atlas', tables: ['oracle_map_pins', 'oracle_map_notes', 'oracle_routes', 'oracle_regions', 'oracle_poi_records', 'oracle_worldbuilding_layers'] },
      { label: 'Scribe & Writing', tables: ['oracle_writing_projects', 'oracle_writing_assistant_settings', 'oracle_writing_style_profiles', 'oracle_writing_rubrics', 'oracle_writing_assistant_runs', 'oracle_drive_folder_links'] },
      { label: 'Approvals', tables: ['oracle_approval_queue', 'oracle_conversation_history'] },
    ],
  },
];

export const ALL_TABLES = TABLE_GROUPS.flatMap((g) => g.categories.flatMap((c) => c.tables));

export const GROUP_COLORS = {
  syntarion: '#e8c84a',
  oracle: '#7dd3fc',
};

// Curated, likely-to-churn tables used for the dashboard's recent-activity chart.
export const ACTIVITY_TABLES = {
  syntarion: ['sessions', 'session_logs', 'hercules_events', 'messages', 'dm_memory'],
  oracle: ['oracle_conversation_history', 'oracle_approval_queue', 'oracle_documents', 'oracle_writing_assistant_runs'],
};
