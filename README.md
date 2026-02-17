# Git Activity Tracer Extended

> **Note:** This is an extended fork of [git-activity-tracer](https://github.com/anhalt/git-activity-tracer) by Felix Anhalt, adding git export and anonymization features.

Track your development activity across GitHub and GitLab. Fetch commits, pull/merge requests, and code reviews from your authenticated accounts.

## Quick Start

```bash
# Try it now with npx
npx @tmegit/git-activity-tracer-extended  # Fetch current week
```

**First time setup:**

1. Get a token: [GitHub](https://github.com/settings/tokens) or [GitLab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
2. Set environment variable: `export GH_TOKEN=your_token_here` (or `GITLAB_TOKEN`)
3. Run: `npx @tmegit/git-activity-tracer-extended`

**Install globally** (optional):

```bash
npm install -g @tmegit/git-activity-tracer-extended
git-activity-tracer  # Fetch current week
git-activity-tracer 2025-01-01 2025-01-31  # Specific range
```

## Common Commands

```bash
# Current week activity
git-activity-tracer

# Specific date range
git-activity-tracer 2025-01-01 2025-01-31

# Export formats
git-activity-tracer --format json
git-activity-tracer --format csv

# Git export - create git commits for GitHub contribution graph
git-activity-tracer --format git

# Git export with anonymized messages
git-activity-tracer --format git --anonymize

# All commits from all branches
git-activity-tracer all-commits

# Include URLs in output
git-activity-tracer --with-links
```

## Environment Variables

| Variable           | Required  | Description                           | Default              |
| ------------------ | --------- | ------------------------------------- | -------------------- |
| `GH_TOKEN`         | One of \* | GitHub personal access token          | -                    |
| `GITLAB_TOKEN`     | One of \* | GitLab personal access token          | -                    |
| `GITLAB_HOST`      | No        | GitLab instance URL (for self-hosted) | `https://gitlab.com` |
| `GIT_AUTHOR_NAME`  | No        | Name for git commits (git format)     | `Git Activity Tracer`|
| `GIT_AUTHOR_EMAIL` | No        | Email for git commits (git format)    | `noreply@example.com`|

\*At least one token (GitHub or GitLab) is required. Both can be used simultaneously.

**For Git Export (`--format git`):**
- `GIT_AUTHOR_NAME` and `GIT_AUTHOR_EMAIL` set both author and committer information
- Use your GitHub email (e.g., `username@users.noreply.github.com`) for contributions to appear in your GitHub profile
- Find your GitHub noreply email at: https://github.com/settings/emails

## Command Options

| Option              | Description                                           | Default                |
| ------------------- | ----------------------------------------------------- | ---------------------- |
| `<fromdate>`        | Start date (YYYY-MM-DD)                               | Monday of current week |
| `<todate>`          | End date (YYYY-MM-DD)                                 | Today                  |
| `--with-links`      | Include URLs in console output                        | false                  |
| `--format <format>` | Output format: `console`, `json`, `csv`, or `git`     | `console`              |
| `--anonymize`       | Anonymize commit messages and repository names        | false                  |
| `config`            | Display configuration file location                   | -                      |
| `project-id`        | Manage repository project ID mappings                 | -                      |
| `all-commits`       | Show all commits from all branches (see below)        | -                      |

### All Commits Command

Show all commits from all branches (including feature branches):

```bash
git-activity-tracer all-commits                        # Current week
git-activity-tracer all-commits 2025-12-01 2025-12-31  # Date range
git-activity-tracer all-commits --format csv           # Export
```

**Difference from default:**

- **Default**: Commits from base branches (main/master/develop) + PRs + reviews
- **all-commits**: ALL commits from ALL branches (including feature branches)

### Git Export Format

The `--format git` option creates a local git repository with commits representing your contributions. This is useful for populating your GitHub contribution graph with activity from private repositories or other platforms.

**Important:** Set your own name and email for contributions to appear in your GitHub profile:

```bash
# Use your GitHub noreply email for proper attribution
export GIT_AUTHOR_NAME="Your Name"
export GIT_AUTHOR_EMAIL="your-id+username@users.noreply.github.com"

# Export contributions as git commits
git-activity-tracer 2025-01-01 2025-12-31 --format git
```

This creates a `git-contributions-export/` directory with git commits for each contribution. Each commit:
- Preserves the original timestamp (both author and committer dates)
- Uses your configured name and email
- Includes metadata about the contribution type and repository

**Anonymization**: Use `--anonymize` to hash commit messages and repository names while preserving structure:

```bash
git-activity-tracer --format git --anonymize
```

Anonymization is consistent (same input → same hash) and preserves conventional commit prefixes (e.g., `feat:`, `fix:`).

**Push to GitHub:**

```bash
cd git-contributions-export
git remote add origin git@github.com:username/activity-showcase.git
git branch -M main
git push -u origin main --force
```

**Why use this?**

- Showcase your work from private repositories
- Combine GitLab and GitHub activity in one contribution graph
- Create a portable record of your development activity
- Anonymize sensitive project details while showing activity patterns

## Project ID Mapping

Map repositories to project IDs for billing and time tracking:

```bash
git-activity-tracer project-id add owner/repository PROJECT-123
git-activity-tracer project-id list
git-activity-tracer project-id remove owner/repository
```

Project IDs automatically appear in all output formats (console, JSON, CSV).

## Configuration

Configuration file: `~/.git-activity-tracer/config.json` (auto-created on first run)

```bash
# View configuration location
git-activity-tracer config
```

### Custom Base Branches

**Note:** Base branch configuration applies **only to GitLab**. GitHub automatically uses the default branch via the GraphQL API and does not require configuration.

Default branches tracked (GitLab only): `main`, `master`, `develop`, `development`

To add more branches for GitLab, edit the configuration file:

```json
{
  "baseBranches": ["main", "master", "develop", "development", "trunk", "staging"],
  "repositoryProjectIds": {
    "owner/repository": "PROJECT-123"
  }
}
```

**Platform differences:**

- **GitHub**: Uses GraphQL `contributionsCollection` API which automatically provides commits from the default branch. The `baseBranches` configuration is not used.
- **GitLab**: Filters push events by the configured `baseBranches` to determine which commits to include in reports.
- **Both platforms**: `all-commits` command ignores base branch configuration and returns commits from all branches.

### Self-Hosted GitLab

```bash
export GITLAB_HOST=https://gitlab.your-company.com
export GITLAB_TOKEN=your_token_here
```

## Development

```bash
pnpm install        # Install dependencies
pnpm start          # Run in development
pnpm test           # Run tests
pnpm run lint       # Lint code
pnpm run format     # Format code
pnpm build          # Build for distribution
```

## Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning:

- `feat:` - New feature (minor bump: 1.0.0 → 1.1.0)
- `fix:` - Bug fix (patch bump: 1.0.0 → 1.0.1)
- `feat!:` or `BREAKING CHANGE:` - Breaking change (major bump: 1.0.0 → 2.0.0)
- `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:` - No version bump

Commits to `main` trigger automated releases via semantic-release.

## API Limitations

- **GitHub**: Up to 50 repositories, 100 commits per repository
- **GitLab**: Up to 1000 events and 1000 merge requests per query

## Credits

This is an extended fork of [git-activity-tracer](https://github.com/anhalt/git-activity-tracer) by [Felix Anhalt](https://github.com/anhalt).

**Original Project:** https://github.com/anhalt/git-activity-tracer  
**Extended Features Added:**
- Git export format (`--format git`) to create local git repositories
- Anonymization support (`--anonymize`) for all output formats
- Custom author/committer credentials via environment variables
- Enhanced documentation and test coverage

## License

Apache-2.0 License © Felix Anhalt
