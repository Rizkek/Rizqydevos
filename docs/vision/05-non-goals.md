# Non-Goals

This document defines what DevOS is **not**. These boundaries are as
important as the features themselves. Anything in this list that someone
proposes adding needs a formal review against the [principles](./03-principles.md)
and a clear justification in an ADR.

---

## DevOS is NOT a SaaS Product

DevOS is self-hosted. It is built for one developer (or a small community
of developers who fork it). There is no multi-tenancy, no subscription,
no pricing page, no onboarding funnel.

❌ User registration flows for the public  
❌ Subscription management  
❌ Pricing tiers  
❌ SaaS billing  
❌ Public-facing marketing pages  

---

## DevOS is NOT a Career Management Platform

Career management is the core business of **TRASON**. DevOS only surfaces
career-related status as a personal snapshot — not a management system.

**In DevOS (widget only):**
✅ Portfolio last updated  
✅ CV version and last updated date  
✅ LinkedIn profile status  
✅ GitHub contribution streak  
✅ Current skill in progress  
✅ Current learning goal  
✅ Certifications list  
✅ Wishlist companies  

**Not in DevOS — belongs in TRASON:**
❌ Job application tracker  
❌ ATS optimization tools  
❌ Resume builder  
❌ Company research database  
❌ Interview preparation system  
❌ Offer comparison tools  
❌ Networking CRM  
❌ Salary benchmarking  
❌ Internship tracker  
❌ Career roadmap builder  

---

## DevOS is NOT a Financial Management Application

Finance features in DevOS are limited to a market watchlist and personal
expense summary. Deep financial tooling is out of scope entirely.

**In DevOS (widget only):**
✅ Gold price watchlist  
✅ IHSG watchlist  
✅ Crypto watchlist  
✅ Economic calendar  
✅ Portfolio value snapshot  
✅ Trading journal shortcut  
✅ Expenses this month  
✅ Income this month  

**Not in DevOS:**
❌ Budgeting system  
❌ Accounting features  
❌ Invoice generation  
❌ Payroll management  
❌ Financial planning tools  
❌ Tax calculation  
❌ Investment analysis platform  
❌ Trading execution  

---

## DevOS is NOT a Team Collaboration Tool

DevOS is personal. It is not designed to be shared, operated in a team,
or used as a project management tool for groups.

❌ Team workspaces  
❌ Shared documents with permissions  
❌ Team calendars  
❌ Group chat  
❌ Organization management  

---

## DevOS is NOT a Replacement for Specialized Tools

DevOS integrates with specialized tools. It does not replace them.

| Tool | DevOS Shows | DevOS Does NOT Do |
|------|------------|-------------------|
| GitHub | Activity, open PRs, recent repos | Full code review, branch management |
| Vercel | Deployment status | Full deployment configuration |
| Supabase | Database health | Query editor, schema management |
| Docker | Container status | Image building, compose management |
| Postman | API collection shortcuts | Full API testing environment |
| Grafana | Key metrics widget | Full monitoring dashboards |

---

## DevOS is NOT a General Productivity App

DevOS is not Notion. It is not Todoist. It is not a calendar app. It
borrows inspiration from these tools in specific areas, but it does not
aim to be a general-purpose productivity suite for non-developers.

❌ Rich text editor replacing Notion  
❌ Complex recurring task system  
❌ Meeting scheduling for external parties  
❌ Document sharing with non-developers  
❌ CRM or client management  

---

## DevOS is NOT an AI Chatbot Interface

AI features in DevOS are contextual assistants, not a general-purpose
chat interface. DevOS is not a front-end for ChatGPT.

❌ General AI chat for non-development topics  
❌ AI image generation  
❌ AI writing for marketing copy  
❌ Consumer-facing AI assistant  

---

*Last updated: 2026-07-17*
*Status: Foundation*
