# Issue tracker: Local Markdown

This is a closed-source repo and does not use GitHub Issues or pull requests as a work tracker. Issues, specs, tickets, and wayfinding maps live as markdown files in `.scratch/`.

## Conventions

- One feature or effort per directory: `.scratch/<feature-slug>/`
- Specs are written to `.scratch/<feature-slug>/SPEC.md`
- Implementation tickets are written to `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file
- Comments and conversation history append to the bottom of the file under `## Comments`

Do not call `gh issue`, `gh pr`, or GitHub issue APIs for mattpocock/skills workflows in this repo.

## When a skill says "publish to the issue tracker"

Create a new markdown file under `.scratch/<feature-slug>/`, creating the directory if needed.

## When a skill says "fetch the relevant ticket"

Read the referenced markdown file. The user should pass the path, or enough context to identify the file under `.scratch/`.

## Wayfinding operations

Used by `/wayfinder`. The map is a file with one child file per ticket.

- **Map**: `.scratch/<effort>/map.md`
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`
- **Blocking**: a `Blocked by: NN, NN` line near the top
- **Frontier**: scan `.scratch/<effort>/issues/` for open, unblocked, unclaimed files; first by number wins
- **Claim**: set `Status: claimed` before work starts
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`, then update the map's decisions or notes
