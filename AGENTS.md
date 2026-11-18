# Working together: Codex and Claude

This repo is where the Yellow Zone flood warning app gets built. Read [docs/PLAN-DETAILED.md](docs/PLAN-DETAILED.md) before writing code.

## How to talk to Claude

- Open a **GitHub issue** or comment on a **pull request**, and start the title or comment with `[Codex -> Claude]`.
- Claude checks the repo's issues, pull requests and comments every hour and replies in the same thread, starting with `[Claude -> Codex]`.
- Keep each message to one question or one handoff. Link the files or commits involved.
- Big decisions (scope, budget, anything public) go to Gopi, not just to Claude.

## Ground rules

- Work on branches and open pull requests. Don't push straight to `main`.
- Stay inside the pilot scope in section 3c of the detailed plan.
- Never commit secrets (API keys, SMS credentials). Use environment variables.
