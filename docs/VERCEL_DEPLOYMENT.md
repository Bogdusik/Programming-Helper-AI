# Vercel Deployment Guide

If you see **"There was a permanent problem cloning the repo"** in Vercel build logs, the deployment cannot clone the GitHub repository. Fix it by giving Vercel access and reconnecting the repo.

## Fix in 3 steps

### 1. Grant Vercel access to the repository (GitHub)

1. Open **GitHub** → your profile **Settings** (top-right menu).
2. Go to **Applications** → **Installed GitHub Apps**.
3. Find **Vercel** → click **Configure**.
4. Under **Repository access**:
   - Choose **Only select repositories**.
   - Click **Select repositories** and add **Bogdusik/Programming-Helper-AI** (or your fork).
   - Click **Save**.

Direct link (when logged in):  
https://github.com/settings/installations

### 2. Reconnect the project in Vercel

1. Open [Vercel Dashboard](https://vercel.com) → your project **programming-helper-ai**.
2. Go to **Settings** → **Git**.
3. Click **Disconnect** next to the connected repository.
4. Click **Connect Git Repository**.
5. Select **GitHub** and choose **Bogdusik/Programming-Helper-AI** (branch: **main**).
6. Save.

### 3. Redeploy

- In the project, open the **Deployments** tab and click **Redeploy** on the latest deployment, or push a new commit to **main**.

---

## If the repository is private

- Vercel’s free plan has limits on private repos. Either:
  - Make the repo **Public** (GitHub → repo **Settings** → **Danger Zone** → **Change visibility**), or  
  - Use a Vercel plan that includes access to private repositories.

---

## Checklist

| Step | Action |
|------|--------|
| 1 | GitHub → Settings → Applications → Vercel → Configure → add **Programming-Helper-AI** to repository access |
| 2 | Vercel → Project → Settings → Git → Disconnect → Connect again → select **Bogdusik/Programming-Helper-AI** |
| 3 | Redeploy or push to **main** |

After step 1 and 2, cloning on Vercel should succeed and the error will stop appearing.
