# Release process

VaultCV uses [`release-please`](https://github.com/googleapis/release-please-action) in the **upstream template repository** to automate semantic versioning, changelog updates, GitHub tags, and GitHub Releases from Conventional Commit messages.

> Repositories created from the template are free to keep, modify, or remove this automation.

## How it works

1. Changes are merged into `main` using Conventional Commit messages such as `feat:`, `fix:`, or `feat!:`.
2. The `.github/workflows/release-please.yml` workflow opens or updates a release PR.
3. When that release PR is merged, `release-please` creates the Git tag, GitHub Release, and changelog entry.

## Commit message examples

```text
feat: add CV import wizard
fix: prevent broken profile image fallback
feat!: change public profile URL format
docs: clarify local setup steps
```

## Notes for maintainers

- The repo is treated as a **single product release** even though it contains both `web/` and `api/` packages.
- The `release-please-config.json` file keeps `web/package.json`, `api/package.json`, and their `package-lock.json` versions aligned with the root release version.
- The initial setup uses a `bootstrap-sha` so release notes start from the release automation introduction rather than the entire project history.
- If you want other workflows to run automatically on release PRs, you may prefer using a PAT instead of the default `GITHUB_TOKEN`.
