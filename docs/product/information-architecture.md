# Information Architecture

This document defines the complete navigation structure of DevOS —
every section, every sub-section, and every widget. This is the
single source of truth for the sidebar, routing, and feature planning.

---

## Top-Level Navigation

```
DevOS
│
├── Dashboard          ← Mission Control overview
├── Projects           ← Active projects and repositories
├── Workspace          ← Personal productivity tools
├── Knowledge          ← Notes, docs, and learning
├── Developer          ← Dev tools and workflow
├── Infrastructure     ← Servers, deployments, services
├── Security           ← Secrets, audits, and protection
├── Monitoring         ← Metrics, logs, and alerts
├── AI                 ← Prompts, agents, and automation
├── Analytics          ← Usage data and insights
├── Automation         ← Cron, triggers, and workflows
└── Settings           ← Account, preferences, integrations
```

---

## 1. Dashboard

**Purpose:** Mission Control. The first thing seen when opening DevOS.
Everything relevant to today — at a glance.

### Widgets (all toggleable)

```
Dashboard
│
├── Today's Tasks          ← Top priority items for today
├── GitHub Activity        ← Commits, PRs, issues (last 7 days)
├── Open Pull Requests     ← PRs waiting for review or action
├── Recent Deploys         ← Last deployments across all projects
├── Learning Progress      ← Current course/skill progress
├── AI Assistant           ← Context-aware quick assistant
├── Pomodoro Timer         ← Focus session tracker
├── Server Health          ← Quick status: up/down/degraded
├── Docker Containers      ← Running containers summary
├── Quick Notes            ← Scratchpad for immediate thoughts
├── Reading List           ← Articles and docs queued to read
├── Calendar               ← Today and tomorrow events
├── Weather                ← Local weather (optional)
├── Snippet Quick Access   ← Recently used snippets
├── Bookmarks              ← Pinned bookmarks
├── Career Widget          ← Portfolio, CV, LinkedIn status
└── Finance Widget         ← Market watchlist, portfolio value
```

---

## 2. Projects

**Purpose:** Overview of active development projects and repositories.

```
Projects
│
├── Overview               ← All projects at a glance
├── Board                  ← Kanban view of project tasks
├── Timeline               ← Project timeline and milestones
└── [Project Name]
    ├── README
    ├── Tasks
    ├── Notes
    ├── Links
    ├── Tech Stack
    ├── Deploy Status
    └── Activity
```

---

## 3. Workspace

**Purpose:** Personal productivity tools for day-to-day work.

```
Workspace
│
├── Todo                   ← Personal task list
├── Kanban                 ← Visual task board
├── Calendar               ← Full calendar view
├── Notes                  ← Long-form personal notes
├── Whiteboard             ← Freeform drawing and diagramming
├── Scratchpad             ← Temporary, disposable notes
├── Bookmarks              ← Organized link collection
└── Meeting                ← Meeting notes and agenda
```

---

## 4. Knowledge

**Purpose:** Personal knowledge management. The second brain for a developer.

```
Knowledge
│
├── Library                ← All notes and documents
├── Graph                  ← Knowledge graph visualization
├── Tags                   ← Tag-based browsing
├── Learning               ← Courses, roadmaps, progress tracking
├── Reading List           ← Saved articles and resources
├── Snippets               ← Code snippets with syntax highlighting
│   ├── By Language
│   └── By Tag
└── Documentation          ← Project-specific docs written by user
```

---

## 5. Developer

**Purpose:** Developer-specific tools, workflow, and integrations.

```
Developer
│
├── GitHub                 ← GitHub overview and activity
├── Repository             ← Repos list and quick access
├── Snippets               ← Code snippet collection
├── Packages               ← npm/Go/pip packages tracker
├── API                    ← API collection (Postman-like)
├── Database               ← Database connections and quick queries
├── Docker                 ← Container and image management
├── Terminal               ← Embedded web terminal
├── SSH                    ← SSH connection manager
└── Logs                   ← Log viewer (multiple sources)
```

---

## 6. Infrastructure

**Purpose:** All cloud and server infrastructure in one view.

```
Infrastructure
│
├── Servers                ← VPS and dedicated server list
├── Cloudflare             ← Domain, DNS, WAF status
├── Vercel                 ← Deployment status and logs
├── Supabase               ← Database and auth status
├── Redis                  ← Cache status and metrics
├── Storage                ← R2/S3 buckets overview
├── CI/CD                  ← Pipeline status (GitHub Actions)
├── Cron                   ← Scheduled job manager
└── Health Check           ← Uptime monitoring overview
```

---

## 7. Security

**Purpose:** Security posture, secrets, and audit trail.

```
Security
│
├── Secrets                ← Encrypted secrets manager
├── Audit Log              ← All actions logged with timestamp
├── Dependencies           ← Vulnerability scan results
├── OWASP                  ← OWASP checklist per project
├── Headers                ← HTTP security headers checker
├── SSL                    ← Certificate status and expiry
├── Backup                 ← Backup status and restore log
├── Permissions            ← Access control overview
└── Logs                   ← Security-related log viewer
```

---

## 8. Monitoring

**Purpose:** Observability — metrics, logs, and alerts.

```
Monitoring
│
├── Overview               ← System health at a glance
├── Metrics                ← Key performance metrics
├── Logs                   ← Aggregated log viewer
├── Alerts                 ← Active and historical alerts
├── Uptime                 ← Service uptime history
└── Performance            ← Response time, throughput, errors
```

---

## 9. AI

**Purpose:** AI tools, prompt management, and agent orchestration.

```
AI
│
├── Chat                   ← Context-aware AI assistant
├── Prompt Library         ← Saved and categorized prompts
├── Agents                 ← AI agent configuration and status
├── Automation             ← AI-powered workflow automations
├── RAG                    ← Retrieval-augmented generation setup
├── MCP                    ← Model Context Protocol connections
├── Models                 ← Connected model list and settings
└── Token Usage            ← Usage tracking across providers
```

---

## 10. Analytics

**Purpose:** Personal analytics — code output, learning, and usage trends.

```
Analytics
│
├── Developer Activity     ← Commits, PRs, code output over time
├── Learning Stats         ← Learning hours, topics, progress
├── Pomodoro History       ← Focus session data
├── Productivity Score     ← Daily/weekly productivity trends
└── System Usage           ← DevOS feature usage stats
```

---

## 11. Automation

**Purpose:** Workflow automation without leaving DevOS.

```
Automation
│
├── Workflows              ← Trigger-based automation flows
├── Cron Jobs              ← Scheduled automations
├── Webhooks               ← Incoming and outgoing webhooks
├── Templates              ← Reusable automation templates
└── Logs                   ← Automation execution history
```

---

## 12. Settings

**Purpose:** Account, preferences, and integration configuration.

```
Settings
│
├── Profile                ← User profile and avatar
├── Appearance             ← Theme, density, layout preferences
├── Integrations           ← Connected services (GitHub, Vercel, etc.)
├── Notifications          ← Alert and notification preferences
├── Keyboard Shortcuts     ← Shortcut reference and customization
├── Widgets                ← Dashboard widget visibility and order
├── API Keys               ← Personal API key management
├── Data                   ← Export, import, and backup
└── About                  ← Version, changelog, and credits
```

---

## Widget Catalog

All widgets available on the Dashboard. Each widget can be:

- Enabled or disabled individually
- Resized (small / medium / large)
- Repositioned via drag and drop

| Widget               | Source                   | Size Options  |
| -------------------- | ------------------------ | ------------- |
| Today's Tasks        | Workspace > Todo         | Small, Medium |
| GitHub Activity      | Developer > GitHub       | Medium, Large |
| Open Pull Requests   | Developer > GitHub       | Small, Medium |
| Recent Deploys       | Infrastructure > Vercel  | Small, Medium |
| Learning Progress    | Knowledge > Learning     | Small, Medium |
| AI Assistant         | AI > Chat                | Medium, Large |
| Pomodoro Timer       | Workspace                | Small         |
| Server Health        | Infrastructure           | Small, Medium |
| Docker Containers    | Developer > Docker       | Small, Medium |
| Quick Notes          | Workspace > Scratchpad   | Small, Medium |
| Reading List         | Knowledge > Reading List | Small, Medium |
| Calendar             | Workspace > Calendar     | Medium, Large |
| Weather              | External API             | Small         |
| Snippet Quick Access | Knowledge > Snippets     | Small, Medium |
| Bookmarks            | Workspace > Bookmarks    | Small, Medium |
| Career Status        | Personal                 | Small         |
| Finance Watchlist    | Personal                 | Small, Medium |

---

*Last updated: 2026-07-17*
*Status: Foundation*
