# Vercel: stuck on commit `6d36479`

GitHub **`main` is newer** (see [latest commit](https://github.com/keatfargo/keaton-charter-check/commits/main)).  
If your build log still says:

```text
Cloning ... (Branch: main, Commit: 6d36479)
Build Completed in /vercel/output [~50ms]
Skipping cache upload because no files were prepared
```

Vercel is **not** building the current `main` branch. That old commit has **no** `vercel.json` and **no** real build.

---

## Fix A — Deploy the latest commit (try this first)

**Do not** use **Redeploy** on an old deployment (that repeats `6d36479`).

1. Vercel → **Deployments**
2. Click **Create Deployment** (top right)
3. Choose **Git** → repository `keatfargo/keaton-charter-check` → branch **`main`**
4. Confirm the commit is **`5e8de06`** or newer (not `6d36479`)
5. Deploy with **build cache off**

Check the new log line: `Commit: 5e8de06…` and `npm install` / `vite build`.

---

## Fix B — Reconnect Git

1. **Settings** → **Git** → **Disconnect** repository  
2. **Connect** `keatfargo/keaton-charter-check` again  
3. **Settings** → **General** → **Root Directory**: leave **empty**  
4. Create Deployment from **`main`** (Fix A)

---

## Fix C — GitHub Actions (if dashboard stays stuck)

1. [Create a Vercel token](https://vercel.com/account/tokens)  
2. Locally: `npx vercel link` in this repo → creates `.vercel/project.json`  
3. GitHub → **keaton-charter-check** → **Settings** → **Secrets and variables** → **Actions**:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` (from `.vercel/project.json`)
   - `VERCEL_PROJECT_ID` (from `.vercel/project.json`)
4. Push to `main` — workflow **Deploy to Vercel** runs and deploys the checked-out commit.

---

## Environment variables (Vercel project)

| Name | Required |
|------|----------|
| `OPENAI_API_KEY` | Yes, for live AI |

---

## Success

- Build takes **> 30s**, not ~50ms  
- `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}`
