#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMMIT_MSG="${1:-chore: deploy $(date '+%Y-%m-%d %H:%M')}"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

echo -e "${YELLOW}[1/2] Build check...${NC}"
npm run build
echo -e "${GREEN}  ✅ Build OK${NC}"

echo -e "${YELLOW}[2/2] Push ke GitHub...${NC}"
git add -A

if git diff --cached --quiet; then
  echo -e "${GREEN}  ✅ Tidak ada perubahan.${NC}"
else
  git commit -m "$COMMIT_MSG"
  git push origin "$BRANCH"
  echo -e "${GREEN}  ✅ Pushed ke '${BRANCH}'.${NC}"
fi

echo -e "${GREEN}🎉 Done. Vercel akan auto-deploy dari branch '${BRANCH}'.${NC}"
