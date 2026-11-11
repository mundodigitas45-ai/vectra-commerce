#!/usr/bin/env bash
set -euo pipefail
umask 077

api_repo=/opt/vectra-commerce-api
panel_repo=/opt/vectracommerce
panel_candidate=/root/vectra-criativos-previa-20261110-215952
n8n_db=/root/n8n/n8n_data/database.sqlite
api_branch=agent/creative-art-director-v1-2026-11-11
panel_branch=agent/criativos-direcao-por-foto-2026-11-11

python3 - "$n8n_db" <<'PY'
import sqlite3,sys
with sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True) as db:
    live=db.execute('SELECT active,activeVersionId FROM workflow_entity WHERE id=?',('VcCreativeImgV1',)).fetchone()
    candidate=db.execute('SELECT active FROM workflow_entity WHERE id=?',('VcCreativeImgV11RealPhotoCandidate',)).fetchone()
if live != (1,'1fda68da-8802-4ae7-9603-628eea65231e') or candidate != (0,):
    raise SystemExit('PARADO: publicação n8n ou candidata mudou; nada alterado.')
print('N8N_PRECHECK_OK=true')
PY

test -f "$panel_candidate/package.json"
api_stage=$(mktemp -d /root/vectra-art-api.XXXXXX)
panel_stage=$(mktemp -d /root/vectra-art-panel.XXXXXX)
private=$(mktemp -d /root/vectra-art-n8n.XXXXXX)
container_file="/tmp/vectra-art-base-$$.json"
trap 'docker exec n8n rm -f "$container_file" >/dev/null 2>&1 || true' EXIT

git -C "$api_repo" fetch origin "$api_branch"
git -C "$api_repo" worktree add --detach "$api_stage" FETCH_HEAD
(
  cd "$api_stage"
  npm ci --no-audit --no-fund
  npm run build
  node --experimental-strip-types --test \
    src/modules/creative-image-workers/professional-real-photo-compositor.test.mjs \
    src/modules/creative-image-workers/real-photo-identity.test.mjs
)

docker exec n8n n8n export:workflow --id=VcCreativeImgV11RealPhotoCandidate --output="$container_file" >/dev/null
docker cp "n8n:$container_file" "$private/base.json" >/dev/null
python3 "$api_stage/candidate-patches/prepare-n8n-art-director-candidate.py" \
  --source "$private/base.json" --output "$private/art-director.json"
WORKFLOW_CANDIDATE="$private/art-director.json" \
  node "$api_stage/candidate-patches/test-n8n-art-director-candidate.mjs"

python3 - "$panel_candidate" "$panel_stage" <<'PY'
import os,shutil,sys
source,dest=sys.argv[1:]
shutil.copytree(source,dest,dirs_exist_ok=True,
    ignore=shutil.ignore_patterns('node_modules','.output','.git'))
os.symlink(os.path.join(source,'node_modules'),os.path.join(dest,'node_modules'))
PY

git -C "$panel_repo" fetch origin "$panel_branch"
for path in \
  src/features/creative-center/real-photo-preview-panel.tsx \
  src/features/creative-center/creative-center-page.tsx \
  src/services/vectra-commerce-api.ts
do
  git -C "$panel_repo" show "FETCH_HEAD:candidate-overlays/art-director/$path" > "$panel_stage/$path"
done
(
  cd "$panel_stage"
  ./node_modules/.bin/tsc --noEmit --pretty false
  node --test src/features/creative-center/real-photo-preview.test.mjs
  npm run build > "$private/panel-build.log" 2>&1
)

printf 'API_CANDIDATA=%s\nPAINEL_CANDIDATO=%s\nN8N_JSON_PRIVADO=%s\n' "$api_stage" "$panel_stage" "$private/art-director.json"
printf 'TESTES_E_BUILD_OK=true\nN8N_INATIVO_E_PRODUCAO_INALTERADA=true\n'
