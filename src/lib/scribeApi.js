// src/lib/scribeApi.js
// Single shared brain-call for ALL of Syntarion's AI features.
// Routes through the 'scribe' Supabase Edge Function — no API key in the client.
// Usage: import { callGemini } from './lib/scribeApi';   (from src/*)
//        import { callGemini } from '../lib/scribeApi';  (from src/components/*)

import supabase from './supabase';

export async function callGemini(system, messages, maxTokens = 1024) {
  const { data, error } = await supabase.functions.invoke('scribe', {
    body: { system, messages, max_tokens: maxTokens },
  });
  if (error) throw new Error(error.message || 'The relay to the archives failed.');
  if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error).slice(0, 200));
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Gemini.');
  return text;
}
