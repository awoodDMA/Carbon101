# 🚀  Carbon101 (working title)

*An open‑source, self‑hosted platform for visualising Revit models, automating quantity take‑offs and calculating embodied carbon – powered by **Speckle** and a modern React front‑end.*

---

## ✨  Key Features

| Area                       | Highlights                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Model Hub**              | Upload Revit (and other AEC) models via official Speckle connectors; every *Project → Option → Version* is tracked automatically. |
| **3‑D Viewer**             | Interactive Speckle Viewer embedded in React; inspect elements, filter by material, isolate layers.                               |
| **Quantity Take‑Off**      | Back‑end service extracts element area/volume, thickness and material from Speckle objects in real time.                          |
| **Embodied Carbon Engine** | Integrates ICE, EC3, 2050 Materials and Climatiq APIs to compute tCO₂e per element and per life‑cycle stage (EN 15978 A1–A5).     |
| **Option Comparison**      | Side‑by‑side tables, radar charts and deltas between design options & model versions.                                             |
| **Shareable Dashboard**    | Client‑facing dashboard with read‑only token; each chart downloadable as optimised SVG.                                           |
| **Self‑Hosting**           | All data stays on your own Speckle Server (Docker/K8s); no external vendor lock‑in.                                               |

---

## 🖥️  Tech Stack

* **Front‑end:** Next.js 14 (React 19, App Router) • TypeScript • Tailwind CSS • shadcn/ui • Framer Motion • Apache ECharts
* **3‑D Viewer:** `@speckle/viewer`
* **State/Data:** tRPC • TanStack React Query • Zustand (lightweight client state)
* **Back‑end (separate repo):** NestJS • Python Calc Engine • PostgreSQL/TimescaleDB
* **Tooling:** ESLint • Prettier • Jest • Playwright • GitHub Actions CI
* **Licence:** MIT

---

## 🗺️  Repository Structure (front‑end)

```
carboncanvas-fe/
├─ app/                # Next.js app router pages
├─ components/         # Reusable UI & viewer wrappers
├─ hooks/              # Custom React hooks (tRPC, charts, theme)
├─ utils/              # Shared helpers (exportSvg, classNames…)
├─ styles/             # Tailwind config & global CSS
├─ public/             # Static assets (logo, favicons)
├─ prompts/            # Saved Codex prompts for future reuse
├─ .github/
│  └─ workflows/       # CI scripts (lint, test, build, deploy)
└─ ...
```

---

## ⚡  Quick Start

```bash
# 1. Clone and install deps
$ git clone https://github.com/your‑org/carboncanvas-fe.git
$ cd carboncanvas-fe && npm install

# 2. Copy env vars and run dev server
$ cp .env.example .env.local   # edit env vars as needed
$ npm run dev                  # http://localhost:3000
```

> **Prerequisites:** Node ≥ 20, npm ≥ 10.  For Autodesk model viewing you’ll also need a Forge access token.

### Environment Variables

- `NEXT_PUBLIC_API_URL` – URL of the Carbon101 back end.
- `NEXT_PUBLIC_AUTODESK_CLIENT_ID` – Autodesk Forge client ID.
- `NEXT_PUBLIC_AUTODESK_CLIENT_SECRET` – Autodesk Forge client secret.

To fetch a viewer token, run:

```bash
curl -X POST \
  https://developer.api.autodesk.com/authentication/v1/authenticate \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=$NEXT_PUBLIC_AUTODESK_CLIENT_ID" \
  -d "client_secret=$NEXT_PUBLIC_AUTODESK_CLIENT_SECRET" \
  -d 'grant_type=client_credentials' \
  -d 'scope=viewables:read'
```

The response JSON contains an `access_token` to pass into `<AutodeskViewer/>`.

### Autodesk Viewer Setup

```tsx
import AutodeskViewer from '@/components/autodesk-viewer';

// token = Forge access token from the request above
<AutodeskViewer modelUrn="your-model-urn" token={token} />;
```

---

## 🤖  Working with **Codex**

This repo is designed for *prompt‑driven development*.  Every issue or PR should reference one of the bite‑sized tasks described in **`docs/backlog.md`**.

### Prompt Template

Paste the snippet below into Copilot Chat / ChatGPT ‑ GitHub when starting a new task:

```
Context: <repo‑path>; Next.js 14 + TypeScript + Tailwind.
Task: <clear behaviour + acceptance test>.
Constraints: ≤ 120 LOC per file; follow Prettier; use British English in comments.
```

### Coding Conventions

* Stick to **functional components** with hooks; no class components.
* Name files in *kebab‑case* (`carbon-chart.tsx`).
* Keep React components limited to one per file unless trivial.
* **Tailwind:** favour semantic utility groups (`flex gap‑4 items‑center`).
* All public text (UI, comments, docs) in British English.

### Commit & PR Checklist

1. `npm run lint` & `npm test` pass locally.
2. PR title follows *Conventional Commits* (`feat: add option bar`).
3. Description includes the Codex prompt that generated the diff.
4. One reviewer approval + green CI ⇒ merge.

---

## 🛠️  Useful Scripts

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start local dev server with hot reload |
| `npm run lint`      | ESLint + Prettier check                |
| `npm test`          | Unit tests via Jest                    |
| `npm run build`     | Production build (`.next/`)            |
| `npm run storybook` | Visual test components (optional)      |

---

## 🚀  Deployment Targets

### Vercel (recommended)

1. Connect repo in Vercel dashboard.
2. Set environment variables (`NEXT_PUBLIC_API_URL`,
   `NEXT_PUBLIC_AUTODESK_CLIENT_ID`,
   `NEXT_PUBLIC_AUTODESK_CLIENT_SECRET`).
3. Build command: `npm run build`  – Output: *Next.js App*.

### GitHub Pages

```yaml
# .github/workflows/deploy.yml (excerpt)
- run: npm run build
- run: npx gh-pages -d out
```

Site will be available at `https://<user>.github.io/<repo>/`.

---

## 🤝  Contributing

We welcome pull requests from club members and the wider community.  Please read **`CONTRIBUTING.md`** for our code style, branching model and CLA details.

---

## 📜  Licence

Distributed under the **MIT Licence**.  See `LICENCE` for full text.

---

> © 2025 *Your Organisation / Git Club*.  Built with passion for cleaner, low‑carbon architecture.
