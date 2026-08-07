# julia-lint

> [!WARNING]
> This action is under active development and its interface may change.

A GitHub Action that lints a Julia repository with
[`julialint`](https://github.com/julia-vscode/JuliaLintApp.jl).

The action installs Julia (via juliaup) and JuliaLintApp itself, so it has no
prerequisites beyond a checkout. The exact versions of JuliaLintApp and all of
its dependencies are pinned by the committed `Manifest.toml`, so every run
uses the same, known-good versions. It runs the equivalent of
`julialint --format sarif -o lint-results.sarif .` in the workspace and then:

- emits inline `::error`/`::warning`/`::notice` annotations (visible in the PR
  Files view) from the SARIF output, errors first;
- leaves `lint-results.sarif` in the workspace (also exposed as the
  `sarif-path` output) so a later job can upload it as an artifact — for
  example for [julia-report-ci-results](https://github.com/julia-actions/julia-report-ci-results);
- optionally uploads the SARIF to GitHub code scanning.

The job fails when lint errors are found (exit code 1) or when `julialint`
itself fails (exit code 2); the SARIF file and annotations are still produced
in the error case.

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
| `code-scanning-upload` | `false` | Also upload the SARIF to GitHub code scanning. Requires the `security-events: write` permission; on private repositories this needs GitHub Code Security. |

## Outputs

| Output | Description |
| --- | --- |
| `sarif-path` | Path of the produced SARIF file, relative to the workspace (`lint-results.sarif`). |

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
[JuliaLintApp documentation](https://github.com/julia-vscode/JuliaLintApp.jl#configuration).
