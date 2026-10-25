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
4. Confirm the commit is **`75dfca9`** or newer (not `6d36479`)
5. Deploy with **build cache off**

Check the new log line: `Commit: 5e8de06…` and `npm install` / `vite build`.

---

## Fix B — Reconnect Git

1. **Settings** → **Git** → **Disconnect** repository  
2. **Connect** `keatfargo/keaton-charter-check` again  
3. **Settings** → **General** → **Root Directory**: leave **empty**  
4. Create Deployment from **`main`** (Fix A)

---

## Fix C — Deploy from your laptop (if dashboard stays stuck)

```bash
cd ~/charter-check
git pull
npx vercel link    # pick your existing Vercel project
npx vercel --prod  # builds and deploys the code on disk (latest main)
```

---

## Environment variables (Vercel project)

| Name | Required |
|------|----------|
| `OPENAI_API_KEY` | Yes, for live AI |

---

## Success

- Build takes **> 30s**, not ~50ms  
- `https://<your-app>.vercel.app/api/health` → `{"status":"ok"}`
