#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
checkout="${ALLOYTOOLS_CHECKOUT:-$repo_root/vendor/AlloyTools/org.alloytools.alloy}"
models="$checkout/org.alloytools.alloy.extra/extra/models"

if [[ ! -d "$checkout/.git" ]]; then
  mkdir -p "$(dirname "$checkout")"
  git clone --depth 1 https://github.com/AlloyTools/org.alloytools.alloy "$checkout"
else
  git -C "$checkout" pull --ff-only
fi

if [[ ! -d "$models" ]]; then
  echo "AlloyTools model directory not found: $models" >&2
  exit 1
fi

failed=0
while IFS= read -r -d '' model; do
  output="$(tree-sitter parse "$model" 2>&1)" || {
    printf '%s\n' "$output" >&2
    failed=1
    continue
  }

  if grep -q 'ERROR' <<<"$output"; then
    echo "Parse errors in $model" >&2
    printf '%s\n' "$output" >&2
    failed=1
  fi
done < <(find "$models" -name '*.als' -print0)

exit "$failed"
