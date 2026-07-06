# SoundAgent.io

**AI-native project management with a voice interface.** · [soundagent.io](https://soundagent.io)

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

SoundAgent is a multi-tenant SaaS platform where the AI assistant is a first-class citizen — not a chatbot bolted on the side. It can answer questions about your organisation, navigate the app, and perform mutations (create tasks, invite members, switch orgs) through typed tool calls backed by real database queries. A hands-free, real-time speech-to-speech loop lets you run the whole app without touching a keyboard.

---

![Kanban board with AI sidebar](assets/kanban-ai-action.png)

---

## Features

- **Kanban board** — drag-and-drop tasks across status columns, subtask hierarchies, categories, assignees, due dates and recurrence
- **AI assistant** — conversational interface that understands your org's data and can act on it; full conversation history persisted per user
- **Voice mode** — hands-free, real-time **speech-to-speech**: talk to the assistant and it talks back with sub-second latency, calling the same tools to read and change your data mid-conversation
- **Audit log** — every mutation is logged with actor, entity and metadata; queryable by the AI
- **Multi-tenancy** — org switching, role-based access control (OWNER / ADMIN / MEMBER / VIEWER), email invitations
- **Real-time notifications** — Pusher-backed in-app feed
- **Billing** — Lemon Squeezy subscription tiers with webhook-driven plan enforcement
- **Security** — conversation data encrypted at rest, RBAC at every server boundary

---

## Screenshots

**Landing page**

<table>
<tr>
<td><img src="assets/landing-hero.png" alt="Landing page hero" /></td>
</tr>
<tr>
<td><img src="assets/landing-features.png" alt="Features section" /></td>
<td><img src="assets/landing-how-it-works.png" alt="How it works" /></td>
</tr>
</table>

**App**

<table>
<tr>
<td colspan="2"><img src="assets/dashboard.png" alt="Dashboard with AI briefing" width="100%" /></td>
</tr>
<tr>
<td><img src="assets/ai-sidebar-suggestions.png" alt="AI sidebar with suggested prompts" /></td>
<td><img src="assets/ai-sidebar-org-summary.png" alt="AI sidebar showing org summary" /></td>
</tr>
<tr>
<td><img src="assets/kanban-ai-action.png" alt="Kanban board after AI moved overdue tasks" /></td>
<td><img src="assets/audit-log.png" alt="Audit log with CSV export" /></td>
</tr>
</table>

---

## Stack

![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2d3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169e1?logo=postgresql&logoColor=white)
![Anthropic](https://img.shields.io/badge/Claude_Haiku-d97706?logo=anthropic&logoColor=white)
![OpenAI Realtime](https://img.shields.io/badge/OpenAI_Realtime-412991?logo=openai&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06b6d4?logo=tailwindcss&logoColor=white)
![Pusher](https://img.shields.io/badge/Pusher-300d4f?logo=pusher)

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Framework | Next.js 16 App Router + React Server Components |
| Database  | PostgreSQL via Prisma on Supabase               |
| Auth      | NextAuth.js (credentials + email verification)  |
| AI (text) | Anthropic Claude Haiku                          |
| Voice     | OpenAI Realtime API (`gpt-realtime`, speech-to-speech over WebRTC) |
| Real-time | Pusher private channels                         |
| Billing   | Lemon Squeezy                                   |
| Styling   | Tailwind CSS + Radix UI                         |

---

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for a full breakdown of the data model, auth, AI assistant, voice interface, RBAC and security approach.

---

## Code examples

Annotated excerpts from the codebase illustrating key design decisions:

| File                                                           | What it shows                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`examples/rbac.ts`](examples/rbac.ts)                         | Role × permission matrix — single `can()` call enforced at every server boundary |
| [`examples/activity-tree.ts`](examples/activity-tree.ts)       | O(n) recursive tree builder using a pre-built `childrenMap`                      |
| [`examples/speech-detection.ts`](examples/speech-detection.ts) | Pure functions for RMS-based speech frame detection, fully unit-tested           |

---

## Project status

Active development. Used in production.

---

_Built by [Lenka Kadlec](https://github.com/lenkakadlec)_
