# Module Breakdown

This document defines each module in detail:
its purpose, core features, widgets, future scope, what is explicitly
out of scope, and its dependencies.

Reference the [Information Architecture](./information-architecture.md)
for the full navigation structure.

---

## Module 1 — Dashboard

**Purpose**
The Mission Control of DevOS. The first view when the app opens.
Every widget on the dashboard is optional and independently toggleable.
The goal is a single glance that answers: *"What is happening right now?"*

**Core Features**
- Configurable widget grid (drag, resize, show/hide)
- Persistent layout saved per user
- Quick command palette (Cmd+K / Ctrl+K)
- Keyboard navigation across widgets

**Widgets Available**
See [Information Architecture — Widget Catalog](./information-architecture.md#widget-catalog)

**Out of Scope**
- Shared dashboards (team features)
- Publicly viewable dashboards
- Dashboards embeddable in other sites

**Dependencies**
- All other modules (widgets pull data from each module)
- Settings > Widgets (widget configuration)

---

## Module 2 — Projects

**Purpose**
A high-level overview of all active development projects. Not a full
project management suite — more like a project registry with status
and quick links.

**Core Features**
- Project list with status (active / paused / archived)
- Per-project view: README, tasks, tech stack, links, deploy status
- Kanban board for project-level task management
- Timeline view for milestone tracking
- Quick link to related GitHub repo, Vercel deployment, Supabase project

**Out of Scope**
- Multi-user project collaboration
- Time tracking at the project level (use Pomodoro widget)
- Invoicing or client billing (not a freelance management tool)
- Full Gantt chart (future scope, not MVP)

**Dependencies**
- Developer > GitHub (repository linking)
- Infrastructure > Vercel (deployment status)
- Workspace > Todo (task data)

---

## Module 3 — Workspace

**Purpose**
Personal productivity space. The daily driver for notes, tasks, planning,
and quick captures. The design goal is friction-free access to common
daily tools.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Todo** | Personal task list with priority, due date, and tags |
| **Kanban** | Visual board with customizable columns |
| **Calendar** | Month/week/day view of events and deadlines |
| **Notes** | Long-form markdown notes with folder organization |
| **Whiteboard** | Freeform canvas for diagrams and brainstorming |
| **Scratchpad** | Single, always-accessible temporary note |
| **Bookmarks** | Link collection with tags and search |
| **Meeting** | Meeting agenda and notes with date/attendees |

**Out of Scope**
- Real-time collaborative editing
- Calendar sync with external attendees
- Document signing or sharing
- Rich media embeds (videos, complex layouts)

**Dependencies**
- None (self-contained module)
- Feeds data to: Dashboard widgets, Projects module

---

## Module 4 — Knowledge

**Purpose**
Personal knowledge management. The "second brain" for a developer.
Notes, snippets, learning progress, and a reading list — all in one
searchable, tag-navigable space.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Library** | All notes and documents with full-text search |
| **Graph** | Visual knowledge graph of linked notes |
| **Tags** | Tag-based navigation across all content |
| **Learning** | Course/skill tracking with progress and notes |
| **Reading List** | Articles saved with read status and annotations |
| **Snippets** | Code snippets with syntax highlighting, tags, language filter |
| **Documentation** | User-written project docs with versioning |

**Out of Scope**
- Public knowledge base (publishing to the internet)
- Collaborative editing with others
- AI-generated knowledge (AI assists, human decides what is saved)

**Dependencies**
- AI module (for summarization and search augmentation)
- Feeds data to: Dashboard widgets

---

## Module 5 — Developer

**Purpose**
Developer-specific tooling. The hub for all code-adjacent workflows:
GitHub activity, repository management, API collections, snippets,
database connections, Docker, terminal, and SSH.

**Core Features**

| Feature | Description |
|---------|-------------|
| **GitHub** | Activity overview, contribution graph, PR list |
| **Repository** | All repos with quick clone, star, and status |
| **Snippets** | Shared with Knowledge module — developer view |
| **Packages** | Dependency tracker across projects (npm, pip, Go) |
| **API** | Postman-style API collection and request builder |
| **Database** | Connection manager with lightweight query interface |
| **Docker** | Container list, status, start/stop, logs |
| **Terminal** | Embedded web terminal (xterm.js) |
| **SSH** | SSH connection manager with key storage |
| **Logs** | Log viewer aggregating multiple sources |

**Out of Scope**
- Full IDE functionality (use VS Code)
- Git GUI with full branch/merge management
- Database schema migration management
- Docker image builder

**Dependencies**
- Infrastructure module (servers, deployments)
- Security > Secrets (for credentials/API keys)
- Knowledge > Snippets (shared data)

---

## Module 6 — Infrastructure

**Purpose**
All cloud services, servers, and deployments visible in one place.
The goal is a single-pane-of-glass for infrastructure status — not
a management console for any single service.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Servers** | VPS list with CPU/RAM/disk metrics and SSH quick-connect |
| **Cloudflare** | Domain and DNS status, WAF overview |
| **Vercel** | Deployment list with status, logs, and branch info |
| **Supabase** | Project list with database and auth status |
| **Redis** | Connection status and basic metrics |
| **Storage** | R2/S3 bucket list with usage stats |
| **CI/CD** | GitHub Actions workflow status and recent runs |
| **Cron** | Scheduled job list with last run and next run |
| **Health Check** | Uptime monitoring status for all services |

**Out of Scope**
- Provisioning new servers (use Coolify or direct provider)
- Full Terraform or IaC management
- Multi-cloud cost optimization

**Dependencies**
- Security > Secrets (API keys for cloud providers)
- Monitoring module (metrics data)

---

## Module 7 — Security

**Purpose**
Security posture management for the developer's projects and personal
environment. Not a professional security audit tool — a personal
security hygiene dashboard.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Secrets** | Encrypted key-value store for secrets and credentials |
| **Audit Log** | Immutable log of all actions within DevOS |
| **Dependencies** | Known vulnerability alerts (npm audit, Snyk-style) |
| **OWASP** | Interactive OWASP Top 10 checklist per project |
| **Headers** | HTTP security header checker for any URL |
| **SSL** | Certificate expiry tracker for all domains |
| **Backup** | Backup job status and restore history |
| **Permissions** | Access control overview for connected services |
| **Logs** | Security event log viewer |

**Out of Scope**
- Penetration testing automation
- Professional vulnerability reporting
- Compliance certification management (SOC2, ISO 27001)

**Dependencies**
- Infrastructure module (domain and server list)
- All modules (audit log captures cross-module events)

---

## Module 8 — Monitoring

**Purpose**
Observability for all running systems. Surfaces key metrics, logs,
and alerts without replacing full monitoring stacks like Grafana.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Overview** | System health status across all services |
| **Metrics** | CPU, RAM, response time, error rate charts |
| **Logs** | Centralized log viewer with search and filter |
| **Alerts** | Active alerts with severity, source, and action |
| **Uptime** | Historical uptime percentage per service |
| **Performance** | Request throughput and p95 response time |

**Out of Scope**
- Replacing Grafana/Prometheus for full observability
- Application performance monitoring (APM) at code level
- Distributed tracing setup

**Dependencies**
- Infrastructure module (service list)
- Developer > Logs (log data source)

---

## Module 9 — AI

**Purpose**
AI tooling that is developer-aware. Prompt library, agent management,
context-aware assistant, and model configuration — all in one place.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Chat** | Context-aware assistant with DevOS data access |
| **Prompt Library** | Saved prompts with categories, tags, variables |
| **Agents** | Custom agent definitions, system prompts, tool access |
| **Automation** | AI-powered automations triggered by events |
| **RAG** | Connect knowledge base as retrieval context |
| **MCP** | Model Context Protocol server configuration |
| **Models** | Connected AI providers and model selection |
| **Token Usage** | Daily/monthly token usage per provider |

**Out of Scope**
- Training or fine-tuning models
- Public-facing AI chatbot for end users
- Image/video generation tools
- General consumer AI assistant

**Dependencies**
- Knowledge module (RAG data source)
- All modules (context injection for chat)

---

## Module 10 — Analytics

**Purpose**
Personal analytics for a developer's own activity trends. Not product
analytics — self-awareness tooling.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Developer Activity** | Commit frequency, PR velocity, code output |
| **Learning Stats** | Hours spent learning, topics covered, streaks |
| **Pomodoro History** | Focus session data and productivity patterns |
| **Productivity Score** | Daily/weekly self-defined productivity rating |
| **System Usage** | Which DevOS features are used most |

**Out of Scope**
- Product analytics for other applications
- A/B testing framework
- Revenue analytics

**Dependencies**
- Workspace > Todo (task completion data)
- Developer > GitHub (activity data)
- Knowledge > Learning (progress data)

---

## Module 11 — Automation

**Purpose**
Simple, self-contained workflow automation. Trigger actions based on
events, schedules, or webhooks — without leaving DevOS.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Workflows** | Visual or JSON-defined trigger → action flows |
| **Cron Jobs** | Scheduled automations with history |
| **Webhooks** | Incoming and outgoing webhook endpoints |
| **Templates** | Reusable workflow templates |
| **Logs** | Execution history per automation |

**Out of Scope**
- Complex multi-step visual workflow builder (n8n territory)
- Replacing GitHub Actions for CI/CD
- Business process automation

**Dependencies**
- All modules (automations can read/write any module's data)
- AI module (AI-powered automation steps)

---

## Module 12 — Settings

**Purpose**
Configuration hub for all of DevOS. Every preference, every integration,
every shortcut — organized and accessible.

**Core Features**

| Feature | Description |
|---------|-------------|
| **Profile** | Name, avatar, timezone, language |
| **Appearance** | Theme (dark/light/system), density, accent color |
| **Integrations** | Connect GitHub, Vercel, Supabase, Cloudflare, etc. |
| **Notifications** | Alert preferences and delivery methods |
| **Keyboard Shortcuts** | Full shortcut reference, custom bindings |
| **Widgets** | Dashboard widget visibility, size, and order |
| **API Keys** | Personal API key management for DevOS access |
| **Data** | Export all data, import from backup |
| **About** | Version number, changelog, open-source credits |

**Out of Scope**
- Team member management
- Billing or subscription management
- SSO configuration for organizations

**Dependencies**
- All modules (settings affect global behavior)

---

## Career Widget (Dashboard Only)

**Purpose**
A personal career status snapshot. Not a career management system.
All depth career tooling is in TRASON.

**Data Points**
- Portfolio last updated (date)
- CV version and last updated date
- LinkedIn profile status (link)
- GitHub contribution streak
- Current skill in progress
- Current learning goal or course
- Certifications (list)
- Target companies wishlist

**Out of Scope**
Everything in [non-goals.md](../vision/05-non-goals.md) under "Career Management".

---

## Finance Widget (Dashboard Only)

**Purpose**
A personal finance and market status snapshot. Not a trading or
financial management platform.

**Data Points**
- Gold price (current + change)
- IHSG index (current + change)
- Crypto watchlist (user-defined)
- Economic calendar (upcoming events)
- Portfolio value (manual or via read-only API)
- Trading journal shortcut (links to external journal)
- Expenses this month (manual entry or bank sync read-only)
- Income this month (manual entry)

**Out of Scope**
Everything in [non-goals.md](../vision/05-non-goals.md) under "Financial Management".

---

*Last updated: 2026-07-17*
*Status: Foundation*
