# Architecture

SoundAgent is a multi-tenant project management platform with an embedded AI assistant and voice interface, built on Next.js App Router.

## Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Framework      | Next.js 16 (App Router, React Server Components) |
| Language       | TypeScript                                       |
| Database       | PostgreSQL (Supabase)                            |
| ORM            | Prisma                                           |
| Auth           | NextAuth.js (credentials + email)                |
| AI (text)      | Anthropic Claude Haiku 4.5                        |
| AI (embeddings)| OpenAI `text-embedding-3-small` + pgvector       |
| Voice          | OpenAI Realtime API (`gpt-realtime`, speech-to-speech over WebRTC) |
| Real-time      | Pusher                                           |
| Styling        | Tailwind CSS + Radix UI                          |
| Billing        | Lemon Squeezy                                    |
| Analytics      | PostHog                                          |
| Error tracking | Sentry                                           |
| Email          | ZeptoMail (Send Mail API)                        |

## Repository layout

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Route handlers (ai, voice, auth, webhooks, …)
│   ├── dashboard/        # Organisation overview
│   ├── projects/         # Project board and activity management
│   ├── org/              # Organisation settings and members
│   ├── audit/            # Audit log viewer
│   ├── archived/         # Archived items
│   └── …                 # Auth flows, onboarding, billing, legal
├── components/
│   ├── ai/               # AI sidebar, voice controls, conversation UI
│   └── activities/       # Kanban board, activity list, detail modal
├── hooks/                # Shared React hooks
├── lib/
│   ├── ai/               # AI integration (client, context, tools, conversation)
│   ├── auth/             # Auth helpers and session resolution
│   ├── rbac/             # Role-based access control
│   ├── db/               # Prisma client
│   ├── audit/            # Audit log writer
│   └── …                 # Email, crypto, rate-limiting, notifications
└── types/                # Shared TypeScript types and Prisma enums
```

## Data model

```
User
 └── Membership (role: OWNER | ADMIN | MEMBER | VIEWER) ──→ Organization
                                                      ├── Project
                                                      │    ├── Activity (task/event, tree structure)
                                                      │    │    └── ActivityCategory
                                                      ├── AuditLog
                                                      ├── Invite
                                                      ├── Notification
                                                      └── AiConversation
                                                           └── AiConversationMessage
```

- `Activity` is self-referential (`parentId`) for subtask hierarchies.
- `Activity` carries a `vector(1536)` embedding (pgvector) for semantic retrieval.
- `Membership.role` drives all permission checks via a central RBAC module.
- Conversation messages are encrypted at rest with AES-256-GCM.

## Authentication

- NextAuth.js credentials provider (email + bcrypt).
- Email verification on signup; password reset via tokenised email links.
- `activeOrgId` stored in an `httpOnly` cookie for org-scoped request resolution without an extra DB round-trip.

## Multi-tenancy

Every query is scoped by `organizationId`. `requireProject` and `requireMembership` server helpers enforce this boundary before any data is returned.

## Role-based access control

A single `can(role, permission)` function encodes all permission rules. Every mutation — in server actions and AI tool calls — passes through this check before touching the database.

## AI assistant

The AI sidebar provides a persistent conversational interface accessible from any page. User messages are sent to `/api/ask`. A deterministic fast-path resolves instant navigation without an LLM call; everything else runs through an agentic tool-calling loop that either answers directly or acts on the database through typed tools, returning the result for the model to narrate.

The assistant can:

- Answer questions about the organisation's projects, tasks, members and audit history
- Navigate the app
- Perform mutations: create/update/delete tasks, invite members, switch organisations

Conversation history is persisted per-user and provided as context on each request alongside a snapshot of the organisation's data, so the model can answer common questions without additional database lookups. For open-ended questions, the question is embedded (OpenAI `text-embedding-3-small`) and the most relevant activities are retrieved by cosine distance against their pgvector embeddings (`ORDER BY embedding <=> query`), so context stays relevant as an org's data grows.

Potentially destructive operations (delete, invite) show a confirmation dialog before execution.

## Voice interface

Voice mode is a real-time **speech-to-speech** loop built on the OpenAI Realtime API. The browser opens a WebRTC connection directly to the model, authenticated with a short-lived ephemeral key minted server-side (`/api/voice/session`) so the main API key never reaches the client. Audio streams both ways over the peer connection — the model listens, decides, and speaks back in a single pass, with no separate transcription or text-to-speech step. Server-side voice-activity detection handles turn-taking, and live transcripts of both sides are rendered in the conversation UI.

The voice agent exposes the app's capabilities through its own function tools (list / create / update / delete tasks, navigate). Tool calls arrive over the WebRTC data channel and execute against the same rate-limited, org-scoped API routes the text assistant uses, with the result streamed back for the model to narrate. End-to-end turn latency is instrumented as spans for percentile (p50/p95) monitoring.

## Audit logging

Every mutation writes a structured row to `AuditLog` with actor, action, entity and metadata. The log is surfaced in `/audit` and is available as context to the AI assistant.

## Real-time notifications

Server-side events trigger Pusher channel messages. The client subscribes on mount and renders an in-app notification feed backed by a persisted `Notification` table.

## Billing

Lemon Squeezy handles subscriptions. A webhook at `/api/webhooks/lemonsqueezy` processes subscription events and updates the user's `plan` field. Feature flags (`NEXT_PUBLIC_FEATURE_FLAGS`) control feature availability per plan.

## Security

- AES-256-GCM field-level encryption for conversation messages and other sensitive content.
- RBAC enforced at every server boundary, including AI tool calls.
- Rate limiting on AI and voice endpoints.
- Per-user daily budget cap on AI usage.
- `httpOnly` + `sameSite: lax` cookies for session and org context.
