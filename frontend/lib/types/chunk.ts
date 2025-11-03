export interface Chunk {
  id: string;
  source_id: string;
  bot_id: string;
  chunk_index: number;
  excerpt: string;
  heading?: string;
  publish_date?: string;
  char_range?: { start: number; end: number };
  tokens_estimate: number;
  created_at: string;
}

export interface ChunkListResponse {
  status: string;
  data: Chunk[];
  message?: string;
}
