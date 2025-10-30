# 🧠 GULP (v1.0)

### Product summary

**Gulp** lets organizations embed an intelligent chatbot on their website using their own content (PDFs, Word docs, custom text, or URLs).
Admins upload or link content via a dashboard; Gulp processes it (parse → chunk → embed) and provides a one-line script or API to deploy a chat widget.
End-users can chat with this bot; all interactions are logged for analytics.
Backend is RAG-based (Retrieval-Augmented Generation).

---

## Core stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Frontend      | Next.js (TypeScript) — dashboard + widget |
| Backend       | FastAPI (Python)                          |
| Auth & DB     | Supabase (Postgres + Auth + pgvector)     |
| Storage       | Supabase Storage / S3                     |
| Vector Search | pgvector (Supabase)                       |
| LLMs          | OpenAI / Gemini                           |
| Deployment    | Docker / k8s                              |
| Analytics     | Supabase SQL tables                       |

---

## Core features

### Admin Dashboard

-   Supabase Auth login/signup.
-   Create & configure bots (name, description).
-   Choose LLM provider (OpenAI or Gemini) + parameters.
-   Upload files or URLs for ingestion.
-   Edit **system prompt** (train personality).
-   View analytics (top queries, unanswered).
-   Copy embed script for widget.

### Chat Widget

-   One-line `<script>` embed.
-   Stores `session_id` in localStorage.
-   Maintains last 5 messages as chat context.
-   Sends POST `/query` → gets answer + citations.
-   Simple HTTP (no sockets/streaming).
-   Light/dark theming, thumbs up/down feedback.

### Backend (FastAPI)

-   JWT validation via Supabase.
-   Widget token validation (domain-restricted).
-   Ingestion pipeline: upload, crawl, parse, chunk, embed.
-   RAG query flow (system prompt + history + retrieved docs).
-   LLM adapters for OpenAI/Gemini.
-   Analytics logging per query.
-   Prompt update history.
-   Simple per-bot rate limiting.

---

## User roles

-   **Admin** → Uses dashboard to configure bots.
-   **End-user** → Chats through the embedded widget.

---

## Data flow (high-level)

1. Admin uploads docs or URLs → FastAPI → parse + chunk → embeddings stored in Supabase (pgvector).
2. Widget loads on client site → stores `session_id` → sends query with last 5 messages.
3. FastAPI retrieves top-k chunks → builds prompt → calls chosen LLM → returns response + sources.
4. Query event logged for analytics.

---

## UI overview

**Dashboard pages:**

1. Login / Signup
2. Bot list (cards)
3. Bot config: name, LLM provider, system prompt
4. Upload / URL ingestion
5. System prompt “training” editor
6. Analytics (top queries, unanswered)
7. Widget setup (embed code preview)

**Widget UI:**

-   Floating chat bubble → expands into chat window.
-   Displays history (client-managed).
-   Supports citations and thumbs up/down.

---

## Core APIs

| Endpoint                               | Description                    |
| -------------------------------------- | ------------------------------ |
| `POST /api/v1/bots`                    | Create a bot                   |
| `GET /api/v1/bots/:id`                 | Get bot info                   |
| `PATCH /api/v1/bots/:id`               | Update bot config              |
| `POST /api/v1/bots/:id/sources`        | Upload document or URL         |
| `GET /api/v1/bots/:id/sources`         | List sources                   |
| `POST /api/v1/bots/:id/query`          | Main chat endpoint             |
| `POST /api/v1/bots/:id/prompt-updates` | Add or apply new system prompt |
| `GET /api/v1/bots/:id/analytics`       | Analytics summary              |
| `POST /api/v1/bots/:id/widget-token`   | Create token for widget        |

**/query request body:**

```json
{
    "session_id": "uuid",
    "history": [
        { "role": "user", "text": "prev question" },
        { "role": "assistant", "text": "prev answer" }
    ],
    "query": "Current user question",
    "page_url": "https://site/page"
}
```

**Response:**

```json
{
    "answer": "Bot reply",
    "sources": [{ "url": "https://...", "excerpt": "..." }],
    "usage": { "prompt_tokens": 120, "completion_tokens": 80 },
    "confidence": 0.9
}
```

---

## Database schema (conceptual)

### `bots`

-   id (uuid)
-   org_id (uuid)
-   name (text)
-   description (text)
-   system_prompt (text)
-   llm_provider (enum: openai/gemini)
-   llm_config (json)
-   retention_days (int)
-   created_by (uuid)
-   created_at / updated_at

### `sources`

-   id, bot_id
-   source_type (pdf/docx/html/text)
-   original_url, canonical_url
-   storage_path
-   status (uploaded/parsing/indexed/failed)
-   etag, last_modified, page_checksum
-   created_at

### `chunks`

-   id, bot_id, source_id
-   chunk_index, excerpt, heading
-   embedding (vector)
-   publish_date, tokens_estimate
-   created_at

### `queries`

-   id, bot_id, session_id
-   query_text, page_url
-   returned_sources (json)
-   response_summary (text)
-   tokens_used (int)
-   confidence (float)
-   created_at

### `system_prompt_updates`

-   id, bot_id, requested_by
-   old_prompt, new_prompt, reason
-   auto_applied (bool)
-   created_at

### `widget_tokens`

-   id, bot_id, token_hash
-   allowed_domains[]
-   expires_at
-   created_at

### `rate_limits`

-   id, bot_id, window_start, count

---

## Crawling (for URL ingestion)

-   Supports single-page, sitemap, or depth-limited crawl.
-   Respects robots.txt & crawl-delay.
-   Extracts main content via Readability or boilerpy.
-   Dedup via `etag` + `page_checksum`.
-   Each page becomes a `source`, split into `chunks`.
-   Chunk metadata: heading, excerpt, char_range, tokens_estimate, language.
-   Uses pgvector for embeddings.

---

## Retrieval-Augmented Generation (RAG)

1. Embed query vector.
2. Search pgvector by bot_id (top-k = 6–8).
3. Inject top chunks + system prompt + last 5 messages.
4. Call selected LLM (OpenAI/Gemini).
5. Return answer with citations.

Prompt format:

```
SYSTEM: {system_prompt}
HISTORY: {last 5 messages}
CONTEXT: {retrieved chunks + URLs}
USER: {query}
```

---

## Analytics

-   Queries/day per bot
-   Average latency & token usage
-   Top queries
-   Unanswered queries
-   Feedback ratio

Logged fields: bot_id, session_id, query_text, sources, tokens, confidence.

---

## Security

-   Supabase JWT for dashboard.
-   Widget tokens (domain-restricted) for public embed.
-   HTTPS only.
-   Row-Level Security (Supabase) by org_id.
-   S3 encryption for stored docs.
-   GDPR-compliant delete/export endpoints.

---

## Technical limits

| Category            | MVP Target |
| ------------------- | ---------- |
| Max docs per bot    | 100        |
| Max file size       | 25MB       |
| Max pages per crawl | 500        |
| Retrieval top-k     | 8          |
| Context messages    | last 5     |
| Median latency      | ≤3s        |

---

## Scalability

-   pgvector for MVP; can migrate to Pinecone/Weaviate later.
-   Stateless FastAPI workers.
-   Background jobs for ingestion.
-   Simple DB-based throttling (no Redis).

---

## Monitoring

-   Query latency, LLM cost per bot.
-   Ingestion success/failure counts.
-   Error logs via Sentry.
-   Token usage by provider.

---

## Business value summary

-   5-minute setup for any website to get an AI chat assistant.
-   No ML expertise required.
-   Turns PDFs & websites into interactive Q&A.
-   Reduces support load.
-   Provides user-intent analytics.

---

## Default system prompt

```
You are an intelligent assistant for {{bot_name}}.
Use only provided context to answer.
If unsure, say “I’m not sure — check [link].”
Always cite sources. Keep responses concise and helpful.
```

---

## Future roadmap (v2+)

-   Multi-language support.
-   Real-time streaming.
-   Webhooks + public API.
-   Teams / multi-org roles.
-   Fine-tuning or embedding re-ranking.
