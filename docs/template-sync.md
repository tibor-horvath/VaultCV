# Syncing with the upstream template

If you forked or copied VaultCV from [tibor-horvath/VaultCV](https://github.com/tibor-horvath/VaultCV), you can pull upstream improvements into your own repo automatically using the included **Sync with template** workflow (`.github/workflows/sync-template.yml`).

## How it works

The workflow runs on two triggers:

- **Scheduled** — every Monday at 06:00 UTC.
- **Manual** — via the **Actions** tab → **Sync with template** → **Run workflow**.

When new commits are found on the upstream `main` branch, the workflow:

1. Creates a timestamped branch (`sync/template-YYYYMMDD-HHMMSS`).
2. Merges upstream changes into it using `-X theirs` (upstream wins on conflicts).
3. Records the last synced upstream commit in a repository variable (`LAST_TEMPLATE_SYNC`) so subsequent runs only look at new commits.
4. Opens a pull request against your `main` branch for you to review and merge.

If there are no new upstream commits the workflow exits early without creating a branch or PR.

## First-time setup

The workflow requires the following GitHub Actions **permissions** on your repository:

| Permission | Required for |
|---|---|
| `contents: write` | Pushing the sync branch |
| `pull-requests: write` | Opening the PR |
| `actions: write` | Creating/updating the `LAST_TEMPLATE_SYNC` variable |

These are declared in the workflow file itself. For public repositories they are granted automatically. For private repositories you may need to confirm that Actions have write access in your repo settings (**Settings → Actions → General → Workflow permissions**).

## Conflict resolution strategy

The merge uses `-X theirs`, meaning **upstream changes win on conflicts**. This keeps the sync simple but means any local edits that touch the same lines as an upstream change will be overwritten in the sync branch.

Review the opened PR carefully before merging. If you need to keep a local customization, resolve the conflict in the PR before merging — or simply close the PR and apply the upstream changes manually.

## Changing the upstream source

By default the upstream is `tibor-horvath/VaultCV`. You can point a manual run at a different repository using the **upstream_repo** input field in the **Run workflow** dialog:

```
owner/repo
```

The scheduled run always uses the default (`tibor-horvath/VaultCV`).

## Disabling the workflow

To stop receiving scheduled syncs, delete or disable the workflow in **Settings → Actions → Workflows**, or remove the `schedule` trigger from `.github/workflows/sync-template.yml`.
