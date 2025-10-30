# 🧠 Gulp — Technical Context Specification (v1.0)

### One-liner

> **Gulp** lets any organization easily embed an intelligent chatbot on their website — powered by their own documents, URLs, or custom text — through a simple dashboard and API.

---

## 1. Product Overview

**Goal:**
Gulp enables companies, institutes, and information-heavy websites to add a context-aware chat assistant trained on their own data — PDFs, DOCX files, text, and even website URLs — without writing backend code.

Admins use the **Gulp Dashboard** to:

1. Upload or link content (files or URLs).
2. Configure and “train” their bot.
3. Choose their preferred LLM (OpenAI or Gemini).
4. Copy an embed script to place on their site.
5. View analytics on what users are asking.

End users on client sites interact with a **small chat widget** that connects to Gulp’s backend for intelligent responses.

---

## 2. Key Value Proposition for Clients

| Client Type                     | Benefit                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| **Universities / Institutions** | Automated Q&A about courses, schedules, policies.                |
| **Companies / Product Sites**   | Customer self-service for FAQs, support, documentation.          |
| **Knowledge-base / Blog Sites** | Search and discovery through conversational interface.           |
| **Internal Teams**              | Private bots for training, policy lookup, or document discovery. |

**Value Summary:**

-   Plug-and-play chat widget — no engineering effort.
-   Train bot using PDFs, DOCs, text, or website URLs.
-   Insights: top user questions, missing answers, popular keywords.
-   Secure and compliant (data privacy, access control).
-   Extensible API for developers to query bots programmatically.

---

## 3. Core Feature List (MVP + extensible foundation)

### 🔹 Admin / Dashboard Features

1. **Login / Signup (Supabase Auth)**
   Email/password or OAuth.

2. **Bot Management**

    - Create / edit bots (name, description).
    - Configure system prompt (bot “personality”).
    - Select LLM provider (OpenAI or Gemini).
    - Set token limits, temperature, etc.
    - Generate embed widget token.

3. **Data Ingestion**

    - Upload documents: PDF, DOCX, TXT.
    - Add URLs (crawl, parse, index text).
    - Monitor ingestion progress.

4. **System Prompt “Training”**

    - Editable system prompt field.
    - Option to propose updates from chat results.
    - Audit log for prompt history and reverts.

5. **Analytics**

    - Query volume, popular questions, top keywords.
    - Unanswered questions list.
    - Per-page query heatmap (future version).

6. **Widget & API Setup**

    - Copy one-line script.
    - Configure color theme, position, logo.
    - Option for API key access.

7. **Billing (future extension)**

    - Usage tracking (queries, tokens).
    - Subscription tiers.

---

### 🔹 Chat Widget Features

1. Small floating icon bottom-right of page.
2. Persistent session via `localStorage` session ID.
3. Shows last 5 messages per session (context sent in each query).
4. Responses include citations (document excerpts and URLs).
5. “Thumbs up/down” for feedback (logged in analytics).
6. Light/dark theme matching client website.
7. No socket or streaming — simple HTTP POST request.

---

### 🔹 FastAPI Backend Features

1. **Token Validation**

    - Supabase JWT validation for dashboard.
    - Widget tokens for chat queries (domain-restricted).

2. **Ingestion Pipeline**

    - Handle file uploads (to S3).
    - Crawl URLs, parse HTML (respect robots.txt).
    - Extract readable text.
    - Chunk text, generate embeddings.
    - Store vectors in Supabase (pgvector extension).
    - Mark ingestion job status.

3. **Query Endpoint**

    - Accept `session_id`, `history`, and `query`.
    - Retrieve relevant text from vector DB.
    - Compose final prompt with bot’s system prompt + history + sources.
    - Call chosen LLM (OpenAI/Gemini).
    - Return response, sources, and confidence.

4. **Analytics Logging**

    - Log every query: question, answer summary, source, latency, confidence, tokens used.

5. **Prompt Updates**

    - Create and apply system prompt updates (with history).

6. **Rate Limiting**

    - Per-bot request limits using database counters.

---

### 🔹 Workers / Background Jobs

1. Parse & extract text from documents.
2. Crawl and parse URLs.
3. Generate embeddings in batches.
4. Upsert embeddings to Supabase vector table.
5. Mark ingestion completion.

---

## 4. Technical Architecture

### Primary Stack

| Layer         | Tech                                                   |
| ------------- | ------------------------------------------------------ |
| Frontend      | **Next.js (React, TS)** — dashboard + widget host      |
| Backend       | **FastAPI (Python)** — ingestion, query, admin APIs    |
| Auth & DB     | **Supabase** — Postgres + Auth + pgvector              |
| Storage       | **Supabase storage / S3** — document storage           |
| LLM Providers | **OpenAI** (GPT-4, GPT-4o) and **Gemini** (Gemini-1.5) |
| Vector Search | **pgvector** (Supabase)                                |
| Deployment    | Docker + k8s or Supabase Functions (for MVP)           |

### High-level flow

**1. Admin onboarding**
→ Login (Supabase)
→ Create Bot → Upload content or URLs → Wait for ingestion → Copy embed script.

**2. Widget integration**
→ Website loads Gulp script → Chat UI initializes → Local session_id created → POST `/query` to backend → Gulp responds using trained context.

**3. Retrieval-Augmented Generation (RAG)**
→ Query embeddings computed → Vector search in Supabase → Top chunks injected in prompt → LLM generates answer → Return with sources.

---

## 5. UI Screens (Dashboard)

### 1️⃣ **Login / Signup**

-   Supabase Auth (magic link or email/password)
-   Redirect to `/dashboard`

---

### 2️⃣ **Dashboard Home**

-   Shows all bots created by user.
-   Card view: name, LLM provider, query volume.

Actions:
→ Create new bot
→ View analytics
→ Edit settings

---

### 3️⃣ **Create/Edit Bot**

**Fields:**

-   Name
-   Description
-   System prompt (textarea)
-   LLM provider (dropdown: OpenAI/Gemini)
-   Temperature (slider)
-   Max tokens
-   Save button

**Sections:**

-   “Upload Files”
-   “Add URLs” (with depth and sitemap options)
-   “Train Prompt” (edit prompt + apply)

---

### 4️⃣ **Ingestion View**

-   Shows current sources (file names / URLs)
-   Status per file (uploaded, parsing, indexed, failed)
-   Retry button

---

### 5️⃣ **System Prompt Training**

-   Textarea pre-filled with current system prompt.
-   Chat with model to test prompt (sandbox).
-   “Apply Changes” button → logs update in history.

---

### 6️⃣ **Analytics**

-   Queries today / total
-   Top queries (list)
-   Top URLs (from page_url metadata)
-   Unanswered queries
-   Export CSV

---

### 7️⃣ **Widget Setup**

-   “Copy embed code” section:

    ```html
    <script src="https://gulp.ai/widget.js" data-bot-id="BOT_ID" async></script>
    ```

-   Preview pane showing chat window.
-   Theme options (primary color, icon, position).

---

## 6. Core APIs (FastAPI)

### 1️⃣ Auth & Tokens

| Endpoint                             | Description                     |
| ------------------------------------ | ------------------------------- |
| `POST /api/v1/auth/verify`           | Verify Supabase JWT (dashboard) |
| `POST /api/v1/bots/:id/widget-token` | Create token for widget embed   |

---

### 2️⃣ Bot Management

| Endpoint                  | Description              |
| ------------------------- | ------------------------ |
| `POST /api/v1/bots`       | Create bot               |
| `GET /api/v1/bots/:id`    | Get bot details          |
| `PATCH /api/v1/bots/:id`  | Update bot configuration |
| `DELETE /api/v1/bots/:id` | Delete bot               |

---

### 3️⃣ Data Ingestion

| Endpoint                              | Description                   |
| ------------------------------------- | ----------------------------- |
| `POST /api/v1/bots/:id/sources`       | Upload document or submit URL |
| `GET /api/v1/bots/:id/sources`        | List all sources for a bot    |
| `GET /api/v1/bots/:id/ingest/:job_id` | Check ingestion job status    |

---

### 4️⃣ Query / Chat

| Endpoint                      | Description         |
| ----------------------------- | ------------------- |
| `POST /api/v1/bots/:id/query` | Chat query endpoint |

**Request:**

```json
{
    "session_id": "uuid",
    "history": [
        { "role": "user", "text": "previous question" },
        { "role": "assistant", "text": "previous answer" }
    ],
    "query": "What are the office timings?",
    "page_url": "https://clientsite.com/about"
}
```

**Response:**

```json
{
    "answer": "Our office timings are 9am–6pm.",
    "sources": [
        {
            "url": "https://clientsite.com/about",
            "excerpt": "Office hours 9am–6pm"
        }
    ],
    "usage": { "prompt_tokens": 120, "completion_tokens": 80 },
    "confidence": 0.91,
    "session_id": "uuid"
}
```

---

### 5️⃣ Prompt Updates

| Endpoint                               | Description                 |
| -------------------------------------- | --------------------------- |
| `POST /api/v1/bots/:id/prompt-updates` | Propose or apply new prompt |
| `GET /api/v1/bots/:id/prompt-updates`  | List previous updates       |

---

### 6️⃣ Analytics

| Endpoint                                    | Description        |
| ------------------------------------------- | ------------------ |
| `GET /api/v1/bots/:id/analytics/queries`    | Top queries        |
| `GET /api/v1/bots/:id/analytics/unanswered` | Unanswered queries |

---

## 7. Database Schemas (Conceptual)

### 🗂️ **Users**

-   Managed by Supabase Auth.

### 🤖 **Bots**

| Field          | Type                 | Description                            |
| -------------- | -------------------- | -------------------------------------- |
| id             | UUID                 | Primary key                            |
| org_id         | UUID                 | Organization reference                 |
| name           | Text                 | Bot name                               |
| description    | Text                 | Optional                               |
| system_prompt  | Text                 | Current bot system prompt              |
| llm_provider   | Enum(openai, gemini) | Model provider                         |
| llm_config     | JSON                 | Model params (temperature, max tokens) |
| retention_days | Int                  | Query log retention                    |
| created_by     | UUID                 | Supabase user ID                       |
| created_at     | Timestamptz          | Created time                           |
| updated_at     | Timestamptz          | Last update                            |

---

### 📄 **Sources**

| Field         | Type                                     | Description       |
| ------------- | ---------------------------------------- | ----------------- |
| id            | UUID                                     | Primary key       |
| bot_id        | UUID                                     | Reference to bots |
| source_type   | Enum(pdf, docx, html, text)              | Type of data      |
| original_url  | Text                                     | URL if applicable |
| canonical_url | Text                                     | Normalized URL    |
| storage_path  | Text                                     | S3 key            |
| status        | Enum(uploaded, parsing, indexed, failed) | Ingestion state   |
| etag          | Text                                     | For web sources   |
| last_modified | Timestamptz                              | From HTTP header  |
| page_checksum | Text                                     | Dedup check       |
| created_at    | Timestamptz                              | Created time      |

---

### 🧩 **Chunks**

| Field           | Type         | Description         |
| --------------- | ------------ | ------------------- |
| id              | UUID         | Primary key         |
| source_id       | UUID         | Reference to source |
| bot_id          | UUID         | Reference to bot    |
| chunk_index     | Int          | Chunk order         |
| excerpt         | Text         | Text snippet        |
| heading         | Text         | Heading title       |
| publish_date    | Timestamptz  | Page publish date   |
| char_range      | JSON         | Start/end offsets   |
| embedding       | Vector(1536) | pgvector            |
| tokens_estimate | Int          | Estimated tokens    |
| created_at      | Timestamptz  | Timestamp           |

---

### 💬 **Queries**

| Field            | Type        | Description             |
| ---------------- | ----------- | ----------------------- |
| id               | UUID        | Primary key             |
| bot_id           | UUID        | Bot reference           |
| session_id       | Text        | LocalStorage session ID |
| query_text       | Text        | User query              |
| page_url         | Text        | Page origin             |
| returned_sources | JSON        | List of chunks returned |
| response_summary | Text        | LLM summary (trimmed)   |
| tokens_used      | Int         | Token count             |
| confidence       | Float       | Optional                |
| created_at       | Timestamptz | Timestamp               |

---

### 🧾 **System Prompt Updates**

| Field        | Type        | Description          |
| ------------ | ----------- | -------------------- |
| id           | UUID        | Primary key          |
| bot_id       | UUID        | Reference to bot     |
| requested_by | UUID        | Admin ID             |
| reason       | Text        | User reason          |
| old_prompt   | Text        | Before update        |
| new_prompt   | Text        | After update         |
| auto_applied | Boolean     | Whether auto-applied |
| created_at   | Timestamptz | Timestamp            |

---

### 🔑 **Widget Tokens**

| Field           | Type        | Description      |
| --------------- | ----------- | ---------------- |
| id              | UUID        | Primary key      |
| bot_id          | UUID        | Bot reference    |
| token_hash      | Text        | Hashed token     |
| allowed_domains | Text[]      | Origin whitelist |
| expires_at      | Timestamptz | Expiration       |
| created_at      | Timestamptz | Created time     |

---

### 📊 **Rate Limits**

| Field        | Type        | Description        |
| ------------ | ----------- | ------------------ |
| id           | UUID        | Primary key        |
| bot_id       | UUID        | Bot reference      |
| window_start | Timestamptz | Minute window      |
| count        | Int         | Requests in window |

---

## 8. RAG Pipeline (Technical Flow)

1. **User query** → widget sends session_id + last 5 messages.
2. **Backend** →
   a. Validates token
   b. Embeds query → searches Supabase vector for top-k chunks (filtered by bot_id)
   c. Builds prompt: system_prompt + history + retrieved text
   d. Calls LLM (OpenAI/Gemini)
   e. Logs analytics → returns answer + citations.

---

## 9. Analytics Metrics

-   Queries per bot/day
-   Average latency
-   Top queries
-   Top sources
-   Unanswered queries (no relevant chunks or low confidence)
-   Token usage per LLM provider
-   Feedback ratio (thumbs up/down)

---

## 10. Security & Privacy

-   Widget tokens validated per domain.
-   All communication via HTTPS.
-   Files stored encrypted (S3/Supabase storage with KMS).
-   Supabase Row-Level Security (RLS) to isolate bots by org.
-   Option to delete user data or entire bot (GDPR compliance).
-   Configurable retention policy for query logs.

---

## 11. Scalability & Extensibility

-   Uses **pgvector** initially, can migrate to **Pinecone/Weaviate** later.
-   Pluggable **LLM adapters** (OpenAI, Gemini; Anthropic later).
-   Asynchronous ingestion pipeline for large batches.
-   Multi-org and team access control (roadmap).
-   Observability: metrics for ingestion success, query latency, token consumption.

---

## 12. Product Roadmap (High-Level)

| Phase        | Focus          | Features                                                    |
| ------------ | -------------- | ----------------------------------------------------------- |
| **MVP (v1)** | Functionality  | File + URL ingestion, chat widget, OpenAI/Gemini, analytics |
| **v1.5**     | UX & Scale     | Improved dashboard UI, keyword analytics, bulk ingestion    |
| **v2.0**     | Developer APIs | Public API access, webhooks, SDKs                           |
| **v2.5**     | Enterprise     | Multi-org roles, on-prem agents, fine-tuned models          |

---

## 13. Default Prompt Template (LLM)

**System prompt:**

```
You are an intelligent assistant for {{bot_name}}.
Answer user queries using the provided context below.
If you’re not sure, say “I’m not sure, but you can check this page: [link].”
Always include citations when referring to a source.
Keep tone friendly and professional.
```

**Injected fields during query:**

-   `system_prompt`
-   `history` (last 5 messages)
-   `retrieved_docs` (top chunks)
-   `query`

---

## 14. Key Technical Decisions

| Area          | Choice                                 | Rationale                               |
| ------------- | -------------------------------------- | --------------------------------------- |
| Vector DB     | Supabase pgvector                      | Simpler, integrated, fewer moving parts |
| Storage       | Supabase storage / S3                  | Easy upload management                  |
| Crawling      | Controlled, same-origin, depth-limited | Prevent abuse & high cost               |
| LLMs          | OpenAI / Gemini                        | Coverage + variety                      |
| Session       | localStorage UUID                      | Lightweight persistence                 |
| Analytics     | Supabase tables                        | Simple to query via SQL                 |
| Rate-limiting | DB counters                            | No Redis dependency                     |

---

## 15. Example Widget Script (for docs)

```html
<div id="gulp-chat" data-bot-id="BOT_ID"></div>
<script src="https://cdn.gulp.ai/widget.js" async></script>
```

-   Auto-initializes and loads chat UI.
-   Stores `session_id` in `localStorage`.
-   Sends `session_id`, last 5 messages, and `page_url` to `/query`.

---

## 16. Example API Response Summary

-   **Average response size:** ~600 tokens
-   **Latency:** 1.5–3s typical
-   **Context window:** last 5 user+assistant messages
-   **Top-k retrieval:** 6–8 chunks
-   **Fallback:** “I don’t know” if confidence < threshold

---

## 17. Monitoring & Metrics

-   API response time (p95)
-   LLM cost per bot
-   Ingestion success ratio
-   Errors by provider
-   Active widget sessions
-   Query-per-minute (QPM) per bot

---

## 18. Non-functional Requirements

| Area         | Target                              |
| ------------ | ----------------------------------- |
| Latency      | ≤ 3s median for query               |
| Availability | 99.5% uptime                        |
| Security     | HTTPS, JWT, domain token validation |
| Privacy      | No query storage if disabled by     |

client |
| Scalability | 100k queries/day with horizontal scaling |
| Observability | Structured logs + metrics (Prometheus) |

---

## 19. Future Expansions

-   Multi-language support.
-   Streaming chat responses (websockets).
-   Fine-tuning custom LLMs.
-   Document change detection (auto reindex).
-   Admin notifications for unanswered queries.
