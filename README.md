# 🚀  Carbon101 (working title)

*An open‑source, self‑hosted platform for visualising Revit models, automating quantity take‑offs and calculating embodied carbon – powered by **Autodesk APS (formerly Forge)** and a modern React front‑end.*

---

## ✨  Key Features

| Area                       | Highlights                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Model Hub**              | Browse Revit (and other AEC) models via Autodesk ACC/BIM 360; every *Project → Option → Version* is tracked automatically using **free Data Management APIs**. |
| **3‑D Viewer**             | Interactive Autodesk Viewer embedded in React using **free Viewer SDK**; inspect elements, filter by material, isolate layers.                               |
| **Quantity Take‑Off** ✅   | Back‑end service extracts element area/volume, thickness and material from Autodesk model data using **free AEC Data Model API**.                          |
| **Embodied Carbon Engine** | Integrates ICE, EC3, 2050 Materials and Climatiq APIs to compute tCO₂e per element and per life‑cycle stage (EN 15978 A1–A5).     |
| **Option Comparison**      | Side‑by‑side tables, radar charts and deltas between design options & model versions.                                             |
| **Shareable Dashboard**    | Client‑facing dashboard with read‑only token; each chart downloadable as optimised SVG.                                           |
| **Self‑Hosting**           | All data stays secure with your Autodesk APS integration; flexible deployment options.                                               |

---

## 🖥️  Tech Stack

* **Front‑end:** Next.js 14 (React 19, App Router) • TypeScript • Tailwind CSS • shadcn/ui • Framer Motion • Apache ECharts
* **3‑D Viewer:** Autodesk Platform Services (APS) Viewer
* **State/Data:** tRPC • TanStack React Query • Zustand (lightweight client state)
* **Back‑end (separate repo):** NestJS • Python Calc Engine • PostgreSQL/TimescaleDB
* **Tooling:** ESLint • Prettier • Jest • Playwright • GitHub Actions CI
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

## 🔍  Autodesk APS API Usage & Costs

This application uses **only free** Autodesk APS (Platform Services) APIs - no usage charges are incurred:

### ✅ **Free APIs Used (No Additional Cost)**
These APIs are available at no additional cost with an Autodesk Developer account:

- **Authentication API** - OAuth 2.0 user authentication and token management
- **Data Management API** - Browse BIM 360/ACC hubs, projects, folders, and file versions  
- **Viewer SDK** - Interactive 3D model visualization in the browser
- **BIM 360 APIs** - Access to BIM 360 project data and file management
- **Autodesk Construction Cloud APIs** - Access to ACC project data (where available)
- **AEC Data Model API** - GraphQL queries for design entities, properties, and quantity takeoff

**Note:** The following free APIs from your list are **not currently used** in this application:
- Autodesk Forma API
- BuildingConnected API
- Data Exchange API
- Data Visualization SDK
- Manufacturing Data Model API
- Parameters API
- Premium Reporting API
- Tandem Data API
- Token Flex API
- Vault Data APIs
- Webhooks (free tier)

### 🚫 **No Premium APIs Used**
This application has been updated to use **only free APIs** - no usage charges are incurred for:
- ✅ **Quantity Takeoff** - Now uses free AEC Data Model API instead of premium Model Derivative API
- ✅ **Model Visualization** - Uses free Viewer SDK
- ✅ **File Browsing** - Uses free Data Management APIs

### 💰 **Zero Cost Operation**
- **No usage charges** - All features use free APIs only
- **No model translation costs** - Direct access to design data via AEC Data Model API
- **No property extraction charges** - Efficient GraphQL queries instead of bulk API calls
- **No webhook charges** - Optional features can be enabled without cost concerns

### 🛡️ **Benefits of Free API Implementation**
1. **Predictable costs** - Only require Autodesk Developer account (free)
2. **Better performance** - GraphQL queries are more efficient than REST pagination
3. **No rate limiting concerns** - Free APIs have generous limits
4. **Scalable architecture** - No cost constraints on usage volume
5. **Future-proof** - Built on Autodesk's recommended AEC Data Model patterns

---

## ⚡  Quick Start

```bash
# 1. Clone and install deps
$ git clone https://github.com/your‑org/carboncanvas-fe.git
$ cd carboncanvas-fe && npm install

$ cp .env.example .env.local   # edit APS_CLIENT_ID, APS_CLIENT_SECRET etc.
$ npm run dev                  # http://localhost:3000
```

> **Prerequisites:** Node ≥ 20, npm ≥ 10.  For model viewing you'll also need Autodesk APS credentials and access to BIM 360/ACC.

> ✅ **Cost-Free Operation:** This application uses only free Autodesk APIs - no usage charges are incurred for any features including quantity takeoff and model visualization.

---

## 🤖  Working with **Codex**

This repo is designed for *prompt‑driven development*.  Every issue or PR should reference one of the bite‑sized tasks described in **`docs/backlog.md`**.

### Prompt Template

Paste the snippet below into Copilot Chat / ChatGPT ‑ GitHub when starting a new task:

```
Context: <repo‑path>; Next.js 14 + TypeScript + Tailwind.
Task: <clear behaviour + acceptance test>.
Constraints: ≤ 120 LOC per file; follow Prettier; use British English in comments.
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
<<<<<<< HEAD
2. Set environment variables (`NEXT_PUBLIC_API_URL`,
   `NEXT_PUBLIC_AUTODESK_CLIENT_ID`,
   `NEXT_PUBLIC_AUTODESK_CLIENT_SECRET`).
3. Build command: `npm run build`  – Output: *Next.js App*.
=======
2. Set environment variables (`APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `NEXT_PUBLIC_API_URL`).
3. Build command: `npm run build`  – Output: *Next.js App*.
>>>>>>> 12bc22b (All changes 07.07.25)

### GitHub Pages

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

> © 2025 *Your Organisation / Git Club*.  Built with passion for cleaner, low‑carbon architecture.