#!/usr/bin/env sh
# The release job's publish step (changesets/action `publish-script`).
#
# 1. Tag every release, as before: the tags promote historia's Docker image, so
#    nothing below may hold them back.
# 2. Publish @eventuras/historia-sdk to npm when its version is not there yet,
#    with npm's trusted publishing (OIDC, no token; the job has `id-token: write`)
#    and provenance. npm 11.5.1 or newer is needed for that, which the workflow
#    installs. A failed publish is reported as an error but does not fail the
#    step, so the tags are still pushed; the next release retries it.
set -eu

pnpm changeset git-tag

name="@eventuras/historia-sdk"
dir="packages/historia-sdk"
version="$(node -p "require('./$dir/package.json').version")"

if [ -n "$(npm view "$name@$version" version 2>/dev/null || true)" ]; then
  echo "$name@$version is already on npm."
  exit 0
fi

pnpm --filter "$name" build
if (cd "$dir" && npm publish --provenance --access public); then
  echo "Published $name@$version to npm."
else
  echo "::error::Publishing $name@$version to npm failed. Is trusted publishing set up for losol/historia's historia.yml on npmjs.com?"
fi
