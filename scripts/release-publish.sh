#!/usr/bin/env sh
# The publish job in historia.yml: publishes each package below whose version is
# not on npm yet, with trusted publishing (OIDC) and provenance. Any failure fails
# the job. Tagging is the tag job's, so this never touches git.
set -eu

field() {
  node -p "require('./$1/package.json').$2"
}

# Asks the registry, not `npm view`: its CDN can miss a version for minutes after
# a publish. The query string bypasses that cache.
on_npm() {
  curl -fsS "https://registry.npmjs.org/$(echo "$1" | sed 's|/|%2f|')?t=$(date +%s)" |
    node -e 'let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () =>
      process.exit(JSON.parse(s).versions?.[process.argv[1]] ? 0 : 1))' "$2"
}

todo=""
for dir in packages/historia-sdk packages/vipps; do
  if on_npm "$(field "$dir" name)" "$(field "$dir" version)"; then
    echo "$(field "$dir" name)@$(field "$dir" version) is already on npm."
  else
    todo="$todo $dir"
  fi
done

if [ -z "$todo" ]; then
  echo "Nothing to publish."
  exit 0
fi

pnpm install --frozen-lockfile --ignore-scripts

failed=0
for dir in $todo; do
  name="$(field "$dir" name)"
  version="$(field "$dir" version)"
  # test:unit, where there is one, leaves out suites that need live credentials.
  tests="$(node -p "require('./$dir/package.json').scripts['test:unit'] ? 'test:unit' : 'test'")"

  if pnpm --filter "$name" typecheck &&
    pnpm --filter "$name" run "$tests" &&
    pnpm --filter "$name" build &&
    (cd "$dir" && pnpm publish --provenance --access public --no-git-checks); then
    echo "Published $name@$version to npm."
  else
    echo "::error::$name@$version was not published. If its checks passed, check its trusted publisher on npmjs.com: losol/historia, historia.yml, environment npm."
    failed=1
  fi
done

exit "$failed"
