# BizIQ Scheduling

**Faculty Effort & Activity Intelligence**
University of Michigan · Department of Urology

Part of the **BizIQ** analytics platform. A lightweight web application for tracking faculty scheduling, time away, and effort allocation against expected targets.

## Quick Start

1. Download all files
2. Open `index.html` in a browser — that's it, no server needed

**Access codes:**
- `admin` → Admin Portal (schedule management)
- `lead` → Leadership Dashboard (analytics)

## Deploy to GitHub Pages

1. Create a new GitHub repo
2. Push all files to `main` (ensure `index.html` is at the root)
3. Settings → Pages → Deploy from branch → `main` / root
4. Live at `https://yourusername.github.io/repo-name/`

## Architecture

Zero dependencies, zero build tools. React + Babel loaded via CDN.

```
index.html    → Entry point
styles.css    → Admin (light) + Leadership (dark) themes
data.js       → Constants, seed faculty, activity types
utils.js      → Metric calculations, schedule generators
app.jsx       → All React components (single file)
```

### Key Concepts

**Base Schedule** — Persistent template per faculty (Week 1–5 × Mon–Fri). What their month *should* look like. Changes only when a permanent schedule shift occurs.

**Active Schedule** — Month-specific instances inheriting from base. Admins layer overrides: time away, coverage swaps, location changes. Each month is stored independently.

**Roles** — Admin Portal is a clean, warm workspace for administrative assistants. Leadership Dashboard is a dark analytical interface for department leadership.

## Features

- Multi-month navigation (past, present, future)
- Click-to-edit cells with inline dropdowns
- Multi-Select bulk editing (log a week of vacation in seconds)
- Override tracking with visual indicators
- Expected vs actual effort variance
- Division-level filtering and sorting

---

*Part of the BizIQ platform · Michigan Medicine*
