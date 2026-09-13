# julia-lint

> [!WARNING]
> This action is under active development and its interface may change.

A GitHub Action that lints a Julia repository with
[`julialint`](https://github.com/julia-vscode/LintApp.jl).

The action installs Julia (via juliaup) and LintApp itself, so it has no
prerequisites beyond a checkout. The exact versions of LintApp and all of
its dependencies are pinned by the committed `Manifest.toml`, so every run
uses the same, known-good versions. It runs the equivalent of
`julialint --format sarif -o lint-results.sarif .` in the workspace and then:

- emits inline `::error`/`::warning`/`::notice` annotations (visible in the PR
  Files view) from the SARIF output, errors first;
- leaves `lint-results.sarif` in the workspace (also exposed as the
  `sarif-path` output) so a later job can upload it as an artifact — for
  example for [julia-report-ci-results](https://github.com/julia-actions/julia-report-ci-results);
- optionally uploads the SARIF to GitHub code scanning.

By default the job fails when lint errors are found (exit code 1) or when
`julialint` itself fails (exit code 2); the SARIF file and annotations are
still produced in the error case. Set `fail-on-errors: false` to make lint
findings non-fatal (a tool failure still fails the step).

## Usage

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: julia-actions/julia-lint@v1
      - uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with:
          name: lintresults
          path: lint-results.sarif
          if-no-files-found: ignore
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `path` | `.` | Path to lint, relative to the workspace. |
| `sarif-path` | `lint-results.sarif` | Path to write the SARIF results file to, relative to the workspace. |
| `max-warnings` | *(unlimited)* | Fail when the warning count exceeds this number. |
| `quiet` | `false` | Report only errors (suppress warnings, info, and hints). |
| `fail-on-errors` | `true` | Fail the step when lint errors are found. When `false`, lint findings never fail the step (a `julialint` tool failure still does). |
| `code-scanning-upload` | `false` | Also upload the SARIF to GitHub code scanning. Requires the `security-events: write` permission; on private repositories this needs GitHub Code Security. |

## Outputs

| Output | Description |
| --- | --- |
| `sarif-path` | Path of the produced SARIF file, relative to the workspace. |
| `error-count` | Number of error-severity lint results. |
| `warning-count` | Number of warning-severity lint results. |

## Updating pinned dependencies

```
julia --project=. -e 'using Pkg; Pkg.update()'
```

and commit the changed `Manifest.toml`.

## Development

The annotation step is a small TypeScript program bundled into `dist/index.js`
(committed). After changing `src/`, run:

```
npm install
npm test
npm run build
```

and commit the updated `dist/index.js` together with the source change.

Linting behavior is configured with a `JuliaLint.toml` file in the linted
repository — see the
[LintApp documentation](https://github.com/julia-vscode/LintApp.jl#configuration).

## Caching

The action caches its own toolkit — LintApp and the tree its `Manifest.toml`
pins — in a depot of its own under `RUNNER_TEMP`, keyed on the runner OS and
architecture, the Julia version and a hash of that manifest. Nothing
run-specific enters the key, so the entry is written once and then only read,
rather than re-saved on every run and duplicated for every pull request the way
a depot cached with `julia-actions/cache` is.

The toolkit is also precompiled against a portable CPU target. Julia's default,
`native`, compiles package images for whichever machine precompiled them while
recording only the literal string `native` in the cache path — so a depot moved
between two runners with different CPUs looks valid, is rejected on load, and
recompiles. GitHub's runner fleet is mixed enough for that to happen regularly;
see [julia-actions/cache#114](https://github.com/julia-actions/cache/issues/114).
A platform whose Julia does not accept the target gets a warning and Julia's
default instead, keeping the behaviour it had before.

None of this needs configuration, and nothing in your workflow should point at
that depot.
