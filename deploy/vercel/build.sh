#!/bin/sh
# Vercel build: fetch the invitation from its public GitHub repo and publish it as static files.
# Redeploying this project always picks up the latest commit on INVITE_REF.
set -eu
REPO="${INVITE_REPO:-GeorgeDevid/invitation-ai}"
REF="${INVITE_REF:-claude/hopeful-franklin-9yhtqq}"
rm -rf public src
mkdir -p public src
curl -fsSL --retry 3 "https://codeload.github.com/$REPO/tar.gz/refs/heads/$REF" | tar -xz -C src --strip-components=1
cp src/index.html public/
cp -R src/assets public/
SHA=$(curl -fsSL "https://api.github.com/repos/$REPO/commits/$REF" 2>/dev/null | sed -n 's/^  "sha": "\([0-9a-f]*\)".*/\1/p' | head -1 || true)
echo "Published $REPO@$REF ${SHA:-}"
find public -type f | sort
