# Syncing with the upstream template

If you forked or copied VaultCV from [tibor-horvath/VaultCV](https://github.com/tibor-horvath/VaultCV), you can pull upstream improvements into your own repo automatically using the included **Sync with template** workflow (`.github/workflows/sync-template.yml`).

## How it works

The workflow runs on two triggers:

- **Scheduled** — every Monday at 06:00 UTC.
- **Manual** — via the **Actions** tab → **Sync with template** → **Run workflow**.

When new commits are found on the upstream `main` branch, the workflow:

1. Checks out the long-lived `sync/template` branch (creating it if it doesn't exist yet).
2. Merges upstream changes into it using `-X theirs` (upstream wins on conflicts) and force-pushes with `--force-with-lease`.
3. Records the last synced upstream commit in a repository variable (`LAST_TEMPLATE_SYNC`) so subsequent runs only look at new commits.

The `sync/template` branch is refreshed in place on every run. You can open a pull request from it manually whenever you are ready to review and merge the upstream changes. If there are no new upstream commits the workflow exits early without touching anything.

## First-time setup

### 1. Create a fine-grained PAT

The workflow needs to read and write a repository variable (`LAST_TEMPLATE_SYNC`). The built-in `GITHUB_TOKEN` does not have the required `variables` scope, so you must create a **fine-grained personal access token** once:

1. Go to [github.com → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens).
2. Click **Generate new token**.
3. Under **Repository access**, select **Only select repositories** and choose your CV repo.
4. Under **Repository permissions**, set **Variables** → **Read and write**.
5. Generate and copy the token.

### 2. Add the PAT as a repository secret

In your repository go to **Settings → Secrets and variables → Actions → New repository secret** and add:

- **Name**: `SYNC_PAT`
- **Value**: the token you just created

### 3. Workflow permissions

`contents: write` is declared in the workflow file itself and is granted automatically. The `SYNC_PAT` is only used for updating the `LAST_TEMPLATE_SYNC` variable — no additional configuration is needed.

## Conflict resolution strategy

The merge uses `-X theirs`, meaning **upstream changes win on conflicts**. This keeps the sync simple but means any local edits that touch the same lines as an upstream change will be overwritten in the sync branch.

Review the `sync/template` branch carefully before opening a PR or merging. If you need to keep a local customization, resolve the conflict manually before merging.

## Changing the upstream source

By default the upstream is `tibor-horvath/VaultCV`. You can point a manual run at a different repository using the **upstream_repo** input field in the **Run workflow** dialog:

```
owner/repo
```

The scheduled run always uses the default (`tibor-horvath/VaultCV`).

## Disabling the workflow

To stop receiving scheduled syncs, delete or disable the workflow in **Settings → Actions → Workflows**, or remove the `schedule` trigger from `.github/workflows/sync-template.yml`.

## Full workflow file

`.github/workflows/sync-template.yml`:

```yaml
name: Sync with template

on:
  workflow_dispatch:
    inputs:
      upstream_repo:
        description: 'Upstream template repository (owner/repo) — defaults to tibor-horvath/VaultCV'
        required: false
        default: 'tibor-horvath/VaultCV'
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 06:00 UTC

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Resolve upstream repo
        id: upstream
        run: |
          REPO="${{ inputs.upstream_repo }}"
          echo "repo=$REPO" >> "$GITHUB_OUTPUT"
          BRANCH="sync/template"
          echo "branch=$BRANCH" >> "$GITHUB_OUTPUT"

      - name: Fetch upstream
        run: |
          git remote add upstream "https://github.com/${{ steps.upstream.outputs.repo }}.git"
          git fetch upstream main --no-tags

      - name: Check for new upstream commits
        id: diff
        run: |
          UPSTREAM_HEAD=$(git rev-parse upstream/main)
          echo "upstream_head=$UPSTREAM_HEAD" >> "$GITHUB_OUTPUT"

          LAST_SHA="${{ vars.LAST_TEMPLATE_SYNC }}"
          if [ -n "$LAST_SHA" ]; then
            echo "Last synced upstream commit: $LAST_SHA"
            COUNT=$(git rev-list ${LAST_SHA}..upstream/main --count 2>/dev/null || echo "unknown")
          else
            echo "No sync record found — first run."
            COUNT=$(git rev-list HEAD..upstream/main --count)
          fi

          echo "count=$COUNT" >> "$GITHUB_OUTPUT"
          if [ "$COUNT" = "0" ]; then
            echo "Already up to date with ${{ steps.upstream.outputs.repo }}."
          else
            echo "$COUNT new commit(s) found upstream."
          fi

      - name: Create sync branch and merge
        if: steps.diff.outputs.count != '0'
        id: merge
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          BRANCH="${{ steps.upstream.outputs.branch }}"
          if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
            git checkout -B "$BRANCH" "origin/$BRANCH"
          else
            git checkout -b "$BRANCH"
          fi
          git merge upstream/main \
            --no-edit \
            --allow-unrelated-histories \
            -X theirs \
            -m "chore: sync with template (${{ steps.upstream.outputs.repo }})"
          git push --force-with-lease origin "$BRANCH"

      - name: Record last synced upstream commit
        if: steps.diff.outputs.count != '0'
        env:
          GH_TOKEN: ${{ secrets.SYNC_PAT }}
          NEW_SHA: ${{ steps.diff.outputs.upstream_head }}
        run: |
          # Requires a fine-grained PAT stored as SYNC_PAT with:
          #   Repository permissions → Variables → Read and write
          if gh api /repos/${{ github.repository }}/actions/variables/LAST_TEMPLATE_SYNC &>/dev/null; then
            gh api --method PATCH /repos/${{ github.repository }}/actions/variables/LAST_TEMPLATE_SYNC \
              -f value="$NEW_SHA"
          else
            gh api --method POST /repos/${{ github.repository }}/actions/variables \
              -f name=LAST_TEMPLATE_SYNC -f value="$NEW_SHA"
          fi
          echo "LAST_TEMPLATE_SYNC set to $NEW_SHA"
```
