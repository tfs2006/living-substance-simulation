## Living Substance Simulation

Living Substance Simulation is a public educational web app that visualizes a fictional human-like nervous system under alcohol use, cannabis use, or both. It is a simplified rule-based model that shows how relief, craving, rebound anxiety, shakiness risk, sleep disruption, panic likelihood, and functional stability may shift over simulated time.

Important boundaries:

- Educational only. Not medical advice.
- No real patient data.
- No dangerous-use optimization.
- Severe withdrawal symptoms need real medical care.
- The model is intentionally uncertain and simplified.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Custom SVG charts

## Local development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Validation

```bash
npm run lint
npm run build
```

## Deploy to Vercel

This project deploys cleanly on Vercel with no environment variables required.

Suggested CLI flow:

```bash
git add .
git commit -m "Initial commit"
gh repo create living-substance-simulation --public --source=. --remote=origin --push
vercel
vercel deploy
vercel deploy --prod
```

## App sections

- Hero and project disclaimer
- Interactive simulator dashboard
- Scenario presets
- Plain-language state explainer
- Safety panel with 988 and SAMHSA information
- Transparent note about model limits

## Project structure

- `src/components/simulation-app.tsx`: main client UI
- `src/lib/simulation/engine.ts`: rule-based simulation engine
- `src/lib/simulation/presets.ts`: seed preset scenarios
- `src/lib/simulation/types.ts`: shared model types
