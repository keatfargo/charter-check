# Vercel troubleshooting

If the build log shows **Commit: 6d36479** (or finishes in ~50ms with “no files were prepared”), Vercel is **not** using the latest `main` from GitHub.

## Fix the Git connection

1. Vercel → your project → **Settings** → **Git**
2. Confirm repository: `keatfargo/keaton-charter-check`
3. **Deployments** → **Redeploy** → enable **Use existing Build Cache: Off** and pick the **latest** `main` commit (not an old deployment).
4. If the commit hash is still old: **Settings** → **Git** → **Disconnect**, then reconnect the repo, or create a new project from the same repo.

## Build settings (dashboard)

| Setting | Value |
|--------|--------|
| **Root Directory** | *(empty — repository root)* |
| **Framework Preset** | Other (or leave on Auto; `vercel.json` controls the build) |
| **Build Command** | *(leave empty to use `vercel.json`)* |
| **Output Directory** | *(leave empty to use `vercel.json`)* |

## Environment variables

- `OPENAI_API_KEY` — required for live AI

## Success looks like

Build log should show a **recent commit** (not `6d36479`), `npm install`, `vite build`, and take **more than a few seconds**.

Test: `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}`
