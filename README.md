# BizIQ Scheduling

**Faculty Effort & Activity Intelligence**
Department of Urology · University of Michigan Health

A lightweight web app for tracking faculty effort allocation, time away, and schedule overrides — built as an internal replacement for QGenda's scheduling input workflow.

## Live Data

This deployment is powered by real QGenda data:

- **73 providers** from the department roster
- **67 base schedule templates** from QGenda Work Patterns
- **25 months** of active schedule data (July 2024 – July 2026)
- **~11,500 override cells** detected (where actual schedule differs from base)

## Architecture

No build tools. No dependencies. Just static HTML/CSS/JS hosted on GitHub Pages.

```
index.html       → Entry point, loads CDN scripts
styles.css       → Admin (light) + Dashboard (dark) themes
data.js          → QGenda-sourced faculty, base schedules, monthly overrides
utils.js         → Metrics, schedule generation, state initialization
app.jsx          → All React components (Babel in-browser)
```

## Two Views

**Schedule Management** (light theme) — For administrative staff
- Faculty sidebar with search and override count badges
- Week × Day schedule grid with click-to-edit cells
- Multi-month navigation with base template toggle
- Multi-Select bulk editing
- Override indicators showing changes from base

**Dashboard** (dark theme) — For leadership
- KPI tiles: faculty count, variance, utilization, time away, overrides
- Sortable/filterable faculty roster
- Click-to-expand detail panel with effort bars and mini heatmap

## Deploy

1. Push all files to a GitHub repository
2. Settings → Pages → Source: main branch, root
3. Site goes live at `https://[username].github.io/[repo]/`

## Local Development

Open `index.html` in a browser. No server needed.

## Data Updates

To refresh with new QGenda exports:
1. Export schedule data and work patterns from QGenda as Excel
2. Run the parser script to regenerate `data.js`
3. Push to GitHub

---

*Built by Tyler — Lead Business Consultant, Department of Urology*
*Part of the BizIQ analytics platform*
