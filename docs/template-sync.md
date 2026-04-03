# Syncing with the upstream template

If you forked or copied VaultCV from [tibor-horvath/VaultCV](https://github.com/tibor-horvath/VaultCV), you can pull upstream improvements into your own repo automatically using the included **Sync with template** workflow (`.github/workflows/sync-template.yml`).

## How it works

The workflow is triggered manually by default. You can optionally enable a schedule (see [Enabling automatic scheduled syncs](#enabling-automatic-scheduled-syncs) below).

- **Manual** — via the **Actions** tab → **Sync with template** → **Run workflow**.
- **Scheduled** — opt-in; disabled by default (see below).

When new commits are found on the upstream `main` branch, the workflow:

1. Checks out the long-lived `sync/template` branch (creating it if it doesn't exist yet).
2. Merges upstream changes into it using `-X theirs` (upstream wins on conflicts) and force-pushes with `--force-with-lease`.
3. Restores this repository's `.github/workflows/` folder after merge. This preserves your local workflow files, but it also means upstream workflow changes and any newly added upstream workflow files under `.github/workflows/` are **not** synced automatically and must be reviewed and applied manually if you want them.
4. Records the last synced upstream commit in a repository variable (`LAST_TEMPLATE_SYNC`) so subsequent runs only look at new commits.
5. Opens a pull request from `sync/template` to `main` (or updates the existing one) so you can review and merge at your own pace.

If there are no new upstream commits the workflow exits early without touching anything.

## First-time setup

### 1. Create a fine-grained PAT

The workflow needs a **fine-grained personal access token** (`SYNC_PAT`) to write the `LAST_TEMPLATE_SYNC` variable and create pull requests. The built-in `GITHUB_TOKEN` does not have the required scopes.

1. Go to [github.com → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens).
2. Click **Generate new token**.
3. Under **Repository access**, select **Only select repositories** and choose your CV repo.
4. Under **Repository permissions**, grant **Read and write** for:
   - **Contents**
   - **Pull requests**
   - **Variables**
   - **Issues** (required for applying labels/assignees to PRs)
5. Generate and copy the token.

### 2. Add the PAT as a repository secret

In your repository go to **Settings → Secrets and variables → Actions → New repository secret** and add:

- **Name**: `SYNC_PAT`
- **Value**: the token you just created

This same token is also used by `actions/checkout` and by an authenticated `git push`, because `persist-credentials` is disabled in the workflow.

### 3. Workflow permissions

In **Settings → Actions → General → Workflow permissions**, ensure **Read and write permissions** is selected. The workflow file declares `contents: write` and `pull-requests: write` itself.

### 4. Seed LAST_TEMPLATE_SYNC for a new downstream repo

When you create a new downstream repository from this template, set the `LAST_TEMPLATE_SYNC` Actions variable to the latest commit SHA of the template repository's `main` branch before the first sync run. This prevents the first run from traversing the entire upstream history.

1. Get the latest template commit SHA from the upstream repo (for example, from the latest commit on [tibor-horvath/VaultCV main](https://github.com/tibor-horvath/VaultCV/commits/main)).
2. In your downstream repository, go to **Settings → Secrets and variables → Actions → Variables**.
3. Create a repository variable:
  - **Name**: `LAST_TEMPLATE_SYNC`
  - **Value**: `<latest-upstream-main-sha>`

If this variable is missing, the workflow still works, but the first sync run may scan all historical upstream commits.

## Changing the upstream source

By default the upstream is `tibor-horvath/VaultCV`. You can point a manual run at a different repository using the **upstream_repo** input field in the **Run workflow** dialog:

```
owner/repo
```

Scheduled runs use the `upstream_repo` input value defined in the workflow file (by default, `tibor-horvath/VaultCV`).

## Enabling automatic scheduled syncs

The workflow ships with the schedule trigger commented out so it doesn't auto-run on forks by default. To enable it, open `.github/workflows/sync-template.yml` and uncomment the `schedule` block:

```yaml
  schedule:
    - cron: '0 8,20 * * *'  # Every day at 08:00 and 20:00 UTC
```

Adjust the cron expression to your preferred cadence and commit the change.

## Customizing PRs (optional)

The workflow reads two optional repository variables to apply labels and assignees to the sync PR automatically. Create them in **Settings → Secrets and variables → Actions → Variables** if you want:

| Variable | Example value | Effect |
|---|---|---|
| `SYNC_TEMPLATE_PR_LABELS` | `dependencies,sync` | Labels applied to the PR |
| `SYNC_TEMPLATE_PR_ASSIGNEES` | `your-github-username` | Assignees added to the PR |

Both variables are optional. If absent, the PR is created without labels or assignees.

## Conflict resolution strategy

The merge uses `-X theirs`, meaning **upstream changes win on conflicts**. This keeps the sync simple but means any local edits that touch the same lines as an upstream change will be overwritten in the sync branch.

Exception: `.github/workflows/` is intentionally restored from your repository after merge, so your local workflow behavior stays in place even if the upstream template modifies workflow files.

Review the `sync/template` branch carefully before merging the PR. If you need to keep a local customization, resolve the conflict manually before merging.

## Disabling the workflow

To stop the workflow from appearing in the Actions tab entirely, delete `.github/workflows/sync-template.yml` or disable it in **Settings → Actions → Workflows**. To keep the file but remove automatic runs, ensure the `schedule` block remains commented out.
