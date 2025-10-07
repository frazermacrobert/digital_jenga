Code of Conduct Jenga — Playful Demo
====================================

A bright, Coca‑Cola‑esque prototype that mirrors an in‑person Jenga activity for a sales conference.
Make choices; remove colour‑coded blocks; keep the tower standing.

How to run
----------
1) Upload all files to a new GitHub repo (you can just drag & drop in the web UI).
2) Enable GitHub Pages (Settings → Pages → Source: Deploy from a branch → Select main/root).
3) Open the GitHub Pages URL and play!

Edit questions
--------------
Open `script.js` and tweak the `QUESTIONS` array — topic, colour, text, and the options with their effects.
- `effect.stability`: positive or negative number
- `effect.remove`: one of `red`, `yellow`, `blue`, `green`, or `null`

Colour key
----------
- red    → Integrity
- yellow → Respect
- blue   → Compliance
- green  → Teamwork

Notes
-----
- No dependencies. Works offline.
- Designed to be keyboard and mobile friendly.
- You can add sound effects later by playing short audio samples when removing blocks or on collapse.
