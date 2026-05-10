# Artly — Build Steps Reference v6.5

---

## Validation Checklist (Run at Start of Every Session)

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cd D:\artly
npm run dev
```
- [ ] App runs on http://localhost:5173
- [ ] D:\artly folder visible in Windsurf Explorer panel
- [ ] artly-creative.vercel.app loads in browser
- [ ] Vercel latest deployment shows green (Ready)

---

## ✅ Completed & Live on Vercel

| Step | What was done | Status |
|---|---|---|
| Scaffold + deploy | React + Vite + Supabase + Vercel | ✅ |
| API layer | detect-materials, generate-ideas, generate-palette, generate-kit, match-colours | ✅ |
| Google auth | Supabase OAuth, guest mode | ✅ (broken on Vercel — config fix pending) |
| Design tokens | CSS variables in index.css | ✅ |
| Landing.tsx | Responsive card panel, logo, gradient CTAs | ✅ |
| App.tsx routing | Landing shows at root for new users | ✅ |
| Onboarding.tsx | Single step, skill level cards | ✅ |
| Create.tsx | Full rebuild — carousel, inline palette, heart save, guest sheet, desktop arrows | ✅ |
| generate-ideas.ts | Updated — rich step objects {title, description, tip} | ✅ |
| generate-palette.ts | Updated — better prompt, returns mixHint | ✅ |
| Project.tsx | New screen — step-by-step project guide at /project | ✅ built, needs route |

---

## 🔧 Next — Do This First

### Step 1: Add /project route to App.tsx

Paste into Cascade:
```
Open src/App.tsx only. Do not touch any other file. Do not run any terminal commands.

Add a new route for the Project screen:
1. Add this import near the other page imports:
   import Project from './pages/Project'

2. Add this route inside the Routes component, alongside the other routes:
   <Route path="/project" element={<Project />} />

Do not change anything else.
```

Then push:
```powershell
cd D:\artly
git add .
git commit -m "feat: project steps screen, enriched idea steps, /project route"
git push origin main
```

### Step 2: Verify flow on Vercel
1. Go to artly-creative.vercel.app
2. Clear localStorage, go through full flow
3. On ideas screen tap "Start this project" → should land on /project with steps
4. Verify: step navigation works, "View all steps" toggle works, materials show, palette shows
5. On last step tap "Journal it" → navigates to /journal

---

## 🔜 Next Screens — In Order

### Screen: Journal
- Mood picker (emoji row)
- Writing prompt chips
- Text area auto-grow
- Star rating
- Saves to Supabase journal_entries table
- Awaiting mockup

### Screen: Saved Tab
- Grid of saved ideas (from localStorage + Supabase saved_ideas table)
- Past sessions sub-tab
- Awaiting mockup

### Screen: Profile
- Signed-in and signed-out states
- Theme switcher (Artisan Dark / Studio Light)
- Skill level setting
- Awaiting mockup

### Screen: Home
- Build LAST — pulls data from all other screens
- Time-aware greeting
- In-progress project card (from artly_active_idea)
- Your projects grid (from saved_ideas)
- Today's idea (static for now)
- Start something new CTA

---

## 📋 Polish Pass (After All Screens Done)

| Item | File | Fix |
|---|---|---|
| Remove "Multiple images supported" badge | Create.tsx | Small text change |
| Rename History → Saved in nav | BottomNav, SideNav, App.tsx | Rename + icon swap |
| Logo size too small on Landing | Landing.tsx | Increase clamp values |
| Desktop branding column narrow | Landing.tsx | Fix flex ratio |
| Logo black bg on light theme | public/logo.png | Re-export transparent |
| Onboarding icon square bg | Onboarding.tsx | Add backgroundColor |
| Unsplash art images | Create.tsx + Project.tsx | Replace Picsum — Step 15 |
| Google auth fix | Supabase dashboard | Check redirect URL config |

---

## Common Commands

| Task | Command |
|---|---|
| Refresh PATH | $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") |
| Start app | cd D:\artly then npm run dev |
| Push to GitHub | git add . then git commit -m "message" then git push origin main |
| Force redeploy | git commit --allow-empty -m "force redeploy" then git push origin main |
| Clear localStorage | Browser console (F12): localStorage.clear() |
| Restore file from git | git checkout origin/main -- src/pages/FILENAME.tsx |

---

## Key Learnings
- Claude API: always serverless proxy, never browser direct
- PowerShell: no && — run commands separately
- Large file rebuilds: generate via Claude bash tool, copy via Windows Explorer — NEVER Cascade full replace
- Cascade corrupts large files — keep prompts targeted and small
- ANTHROPIC_API_KEY — no VITE_ prefix
- Model: claude-haiku-4-5 exactly
- @vercel/node in dependencies not devDependencies
- vercel.json: /api/(.*) BEFORE catch-all
- Response body: read once, strip markdown, then JSON.parse
- Test locally first — push to Vercel only when approved
- lucide-react icons only — emoji break on Vercel
- Google auth only testable on live Vercel URL — not localhost
- Auth pattern: useAuth() from ../contexts/AuthContext — never import supabase directly in pages
- artly_detected_materials + artly_active_idea stored in localStorage for cross-screen data passing
- generate-ideas now returns steps as {title, description, tip} objects — Project.tsx handles both old string[] and new object[] format
