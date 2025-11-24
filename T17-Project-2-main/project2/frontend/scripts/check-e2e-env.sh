#!/usr/bin/env bash
set -euo pipefail

echo "Checking Playwright / Vitest environment for E2E tests"

echo "Node: $(node --version || echo 'node not found')"
echo "NPM: $(npm --version || echo 'npm not found')"

echo "Installed top-level packages:"
npm ls @playwright/test playwright vitest --depth=0 || true

echo "Playwright CLI version:"
npx playwright --version || true

echo "Checking Playwright browsers installed (this will be quick):"
node -e "try{ const p=require('playwright'); console.log('playwright package present'); }catch(e){ console.error('playwright package NOT present'); process.exit(0);}"

echo "Tip: if versions disagree or node_modules is stale, run:
  rm -rf node_modules package-lock.json && npm install && npx playwright install --with-deps
"

echo "Done."
