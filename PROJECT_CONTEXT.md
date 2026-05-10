# Artly — AI Creative Assistant for Artists
## Project Context & Handoff Document v6.5

---

## 🔗 Quick Links
| Resource | URL |
|---|---|
| Live App | artly-creative.vercel.app |
| GitHub | github.com/gkaurwork8290-blip/Artly |
| Supabase | supabase.com/dashboard/project/yhmxrlfizlqylwudzcam |
| Vercel | vercel.com/gkaurwork8290-blips-projects/artly-creative |

---

## 💻 Local Development

**Project location:** D:\artly

**Start the app:**
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cd D:\artly
npm run dev
```
App runs on http://localhost:5173

⚠️ PowerShell: no && — run commands separately.
⚠️ API calls (detect-materials, generate-ideas, generate-palette) only work on Vercel, not localhost.

**Test as new user locally:**
```javascript
localStorage.clear()
```
Then refresh localhost:5173 — shows Landing screen.

**Push to GitHub:**
```powershell
cd D:\artly
git add .
git commit -m "your message"
git push origin main
```

**Workflow:** Always test locally first. Push to Vercel only when screen is fully approved.

**⚠️ Large file rebuilds:** Generate file via Claude bash tool → download → copy to D:\artly\src\pages\ via Windows Explorer → Windsurf will detect change and show "Review" prompt → accept. Never use Cascade for full file replacements on files >200 lines.

---

## 🛠 Tech Stack

| Layer | Tool | Details |
|---|---|---|
| Framework | React + Vite + TypeScript | |
| Styling | Tailwind CSS + CSS custom properties | Two themes: dark + light |
| Routing | react-router-dom | BrowserRouter + vercel.json rewrite |
| Database | Supabase (PostgreSQL) | Mumbai ap-south-1 |
| Auth | Supabase Auth | Google OAuth — works on Vercel, not localhost |
| AI | Claude API (claude-haiku-4-5) | Via /api serverless functions |
| Hosting | Vercel | Auto-deploys from GitHub |
| Icons | lucide-react | Never emoji — emoji break on Vercel |

---

## 🎨 Design System

### Artisan Dark (default)
| Token | Value |
|---|---|
| --color-primary | #6C3CE1 Electric Violet |
| --color-accent | #FF3D71 Hot Pink |
| --color-success | #1D9E75 Emerald |
| --color-warning | #EF9F27 Amber |
| --color-bg | #0F0F1A Deep navy |
| --color-surface | #1A1A2E Cards |
| --color-surface-2 | #0a0a14 Nav bg |
| --color-text | #FFFFFF |
| --color-text-2 | #A0A0C0 |
| --color-text-3 | #5a5a7a |

### Studio Light
Applied via class 'theme-light' on document.body

### Typography
```css
--fs-display: clamp(14px, 3vw, 20px);
--fs-h1: clamp(13px, 2.2vw, 17px);
--fs-h2: clamp(12px, 1.8vw, 15px);
--fs-body: clamp(11px, 1.6vw, 13px);
--fs-caption: clamp(10px, 1.4vw, 12px);
--fs-micro: clamp(9px, 1.2vw, 11px);
```

### Navigation Icons (v6.5)
| Tab | Icon (lucide-react) | Active | Inactive |
|---|---|---|---|
| Home | Home | #6C3CE1 | #5a5a7a |
| Create | Plus (pill bg) | #6C3CE1 | #5a5a7a |
| Saved | Heart | #FF3D71 | #5a5a7a |
| Journal | BookOpen | #1D9E75 | #5a5a7a |
| Profile | User | #EF9F27 | #5a5a7a |

---

## 🗄 Supabase

**URL:** https://yhmxrlfizlqylwudzcam.supabase.co
**Tables:** profiles, sessions, journal_entries, materials
**Auth:** Google OAuth
**Site URL:** https://artly-creative.vercel.app
**Redirect URLs:** https://artly-creative.vercel.app
⚠️ Google auth not working on live Vercel — verify redirect URL in Supabase dashboard

---

## 📁 File Structure

```
D:\artly\
├── api/
│   ├── detect-materials.ts      ← working ✅
│   ├── generate-ideas.ts        ← updated ✅ — now returns rich step objects
│   ├── generate-palette.ts      ← updated ✅ — better prompt, returns mixHint
│   ├── generate-kit.ts          ← gold standard pattern
│   ├── match-colours.ts         ← working ✅
│   └── material-insights.ts     ← API kept, Phase 2
├── public/
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx        ← ⚠️ History tab needs rename to Saved
│   │   └── SideNav.tsx          ← ⚠️ History tab needs rename to Saved
│   ├── pages/
│   │   ├── Landing.tsx          ← ✅ Live
│   │   ├── Home.tsx             ← 🔜 needs rebuild (last screen)
│   │   ├── Onboarding.tsx       ← ✅ Live
│   │   ├── Create.tsx           ← ✅ Live — carousel, palette, heart save, guest sheet
│   │   ├── Project.tsx          ← ✅ Built — step-by-step project screen at /project
│   │   ├── History.tsx          ← ⚠️ rename to Saved.tsx
│   │   ├── Journal.tsx          ← 🔜 needs rebuild
│   │   └── Profile.tsx          ← 🔜 needs rebuild
│   ├── App.tsx                  ← needs /project route added
│   └── index.css                ← design tokens, theme classes
├── vercel.json
├── .env
└── package.json
```

---

## 🔄 User Flow (v6.5)
Landing → Onboarding → Create (input → detect → confirm) → Ideas carousel → **Project steps** → Journal → Saved

---

## ✅ Completed & Live

| Feature | Status |
|---|---|
| Landing screen | ✅ Live |
| App.tsx routing | ✅ Live |
| Onboarding | ✅ Live |
| Create — all input states | ✅ Live |
| Material detection API | ✅ Live |
| Ideas carousel with inline palette | ✅ Live |
| Heart save + guest bottom sheet | ✅ Live |
| Desktop carousel arrows | ✅ Live |
| Project steps screen | ✅ Built — needs /project route in App.tsx |
| Google auth (Vercel only) | ⚠️ Not working — Supabase config check needed |

---

## 🔜 Remaining — In Order

| Step | Feature | Notes |
|---|---|---|
| Fix | Add /project route to App.tsx | Cascade prompt ready below |
| Fix | Google auth on Vercel | Check Supabase redirect URLs |
| Fix | Remove "Multiple images supported" badge | Create.tsx — small change |
| Fix | Rename History → Saved in nav | BottomNav, SideNav, App.tsx |
| Screen | Journal — mood, prompts, rating | Mockup pending |
| Screen | Saved tab | Mockup pending |
| Screen | Profile full redesign | Mockup pending |
| Screen | Home screen | Build last — needs all other screens done |
| Polish | Logo size, transparent PNG, desktop column | Final pass |
| Export | Palette as PDF | Step 14 |
| Images | Unsplash art-specific images | Step 15 |

---

## ⚠️ Critical Rules

1. PowerShell: no &&
2. ANTHROPIC_API_KEY — no VITE_ prefix
3. Model: claude-haiku-4-5 exactly
4. lucide-react icons only — never emoji
5. vercel.json: /api/(.*) before catch-all
6. @vercel/node in dependencies
7. Read response body once
8. Strip markdown before JSON.parse
9. Test locally first — push to Vercel only when approved
10. Git push via terminal only
11. redirectTo in Supabase OAuth = hardcoded 'https://artly-creative.vercel.app'
12. Large files (>200 lines): generate via Claude → copy via Windows Explorer, never Cascade full replace
13. Give Cascade one targeted fix at a time
14. Close Windsurf between numbered prompts
15. No emoji — lucide-react only
16. Google auth only testable on live Vercel, not localhost
17. Auth uses useAuth() from ../contexts/AuthContext — never import supabase directly in pages
18. artly_detected_materials saved to localStorage when ideas generate — available in Project.tsx
19. artly_active_idea saved to localStorage on "Start this project" — available in Project.tsx
