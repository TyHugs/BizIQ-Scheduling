# UroTrack — Faculty Effort & Activity Intelligence

**University of Michigan · Department of Urology**

A lightweight, zero-dependency web application for tracking faculty scheduling, time away, and effort allocation against expected targets. Built as an internal replacement for QGenda's scheduling input workflow, purpose-built for the week-number × day-of-week mental model used in academic urology operations.

## Architecture

- **No build tools required** — pure HTML/CSS/JS with React loaded via CDN
- **Babel in-browser** transforms JSX at runtime (fine for internal tools; swap to a build step for production scale)
- **Single-page app** with role-based routing (Admin vs Leadership)
- **Static hosting** — deploy to GitHub Pages, any web server, or open `index.html` locally

## Concepts

### Base Schedule
A persistent template per faculty member (Week 1–5 × Mon–Fri) representing what their month *should* look like. Month-agnostic — only changes when a permanent schedule change occurs.

### Active Schedule
Month-specific instances that inherit from the base. Admins layer overrides (time away, coverage swaps, one-off changes) on top. Each month is stored independently, allowing edits to past and future months.

### Roles

| Code | Role | Access |
|------|------|--------|
| `admin` | Admin Portal | Light theme, schedule editing, multi-month navigation, bulk edit |
| `lead` / `2026` | Leadership Dashboard | Dark theme, KPIs, variance analysis, effort tracking |

## File Structure

```
index.html        → Entry point, loads all scripts
styles.css        → Complete stylesheet (admin light + leadership dark themes)
data.js           → Constants, seed data, activity types, locations
utils.js          → Pure helper functions (metrics, generators)
components.jsx    → Shared UI components (MonthNav, Toast)
admin.jsx         → Admin Portal (sidebar, schedule grid, bulk edit)
leadership.jsx    → Leadership Dashboard (KPIs, roster, detail panel)
app.jsx           → Root component, login, state management
```

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push all files to the `main` branch
3. Go to **Settings → Pages → Source: Deploy from a branch → main / root**
4. Your site will be live at `https://yourusername.github.io/repo-name/`

## Local Development

Just open `index.html` in a browser. No server needed for basic functionality.

For a local server (avoids any CORS issues with file:// protocol):
```bash
npx serve .
# or
python -m http.server 8000
```

## Next Steps

- [ ] Persistent storage (localStorage or backend API)
- [ ] Real faculty data import
- [ ] Connect to actual effort/productivity data sources
- [ ] SSO integration with Michigan Medicine
- [ ] Export to Excel/PDF for reporting

---

*Built by Tyler — Lead Business Consultant, Department of Urology, University of Michigan Health*
