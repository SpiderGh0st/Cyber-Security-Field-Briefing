# Cyber Security — Field Briefing

An interactive, web-based cyber security awareness course rebuilt from the
original SCORM/Articulate Storyline package — same 11-module curriculum,
all 10 case-study videos, quiz content and closing interviews, redesigned
as a fast, self-contained website.

## What's inside

```
index.html          — the site (open this in any browser)
css/style.css        — design system ("security field dossier" theme)
js/app.js             — rendering, routing, quiz logic, progress tracking
js/course-data.js     — all course content (text, quiz Q&A, media references)
assets/images/        — module reference images + cover art
assets/videos/        — the 10 case-study interview clips
assets/posters/        — video poster frames
```

## Running it

No build step, no server required — just open `index.html` in a browser.
(If your browser blocks local video/font loading, serve the folder instead:
`python3 -m http.server 8000` from this folder, then visit
`http://localhost:8000`.)

## Features

- 11 case files (modules) covering malware, breaches, attacks, prevention,
  mobile & social security, defense techniques, and more
- 40 topic briefings, all original course copy
- 10 embedded case-study interview videos with transcripts
- 100 interactive quiz questions with instant right/wrong feedback,
  scored per module
- Clearance-progress tracker that persists locally in the browser
  (per-device, via `localStorage` — no account or server needed)
- Fully responsive: collapsible sidebar navigation on mobile
- Closing debrief page with the course's closing expert quotes
  (Kevin Mitnick, Frank Abagnale)

## Customizing

All course copy lives in `js/course-data.js` as one JSON object — edit the
`modules` array to change lesson text, quiz questions/answers, or swap
images/videos (drop new files into `assets/` and update the paths).
Visual styling (colors, fonts, spacing) is driven by CSS custom properties
at the top of `css/style.css`.
