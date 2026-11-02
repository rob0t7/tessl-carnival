---
name: review-carnival-house-rules
description: Review a change to a carnival game for the house rules in AGENTS.md that keep every game on the midway, its scores in the shared table, and its drawing in the carnival's theme. Use as one lens in a code review run on changes under src/games/.
---

# Review lens: Carnival House Rules

Review whether a changed game still follows house rules 1 to 3 in `AGENTS.md`: it registers on the midway, reports its scores through the shared scores module, and draws with the carnival's theme.

## Scope

- **Registration** Whether the game can reach the midway: it lives in `src/games/<game-id>/`, its `game.ts` has its `CarnivalGame` as the default export, and the game's `id` matches the folder name.
- **Scores** Whether a finished round reaches the shared high score table: the game calls `recordScore(game.id, score)` from `src/carnival` once when a round ends, and never reads or writes local storage or keeps its own high score table.
- **Theme** Whether the game looks like it belongs on the midway: its colours, fonts and sizes come from `theme` and `canvasFont` in `src/carnival/theme.ts`, not from hex colours, colour names or font strings written inside the game.

## Method

Read the house rules in `AGENTS.md` first, then the changed files in `src/games/`. Use `src/games/water-cannon/game.ts` as the precedent for each rule.

For scores, follow each path that ends a round to the `recordScore` call, and check it runs once per round with the game's own `id`. Look for any other place the game stores or ranks scores.

For the theme, read every value the game passes to the canvas as a colour, font or size, and trace it back to `theme` or `canvasFont`.

## Threshold

Report a change that breaks one of these rules in the game's own code, with what it costs the player or the next author:

- A `game.ts` with no default export, or a default export that is not the game, makes `src/games/index.ts` throw when the midway loads, so the midway does not load at all.
- An `id` that differs from the folder name breaks the house rule. `src/games/index.ts` also throws on it when the midway loads.
- A round that never calls `recordScore`, calls it more than once, or calls it with another id leaves the game's scores missing, doubled or filed under the wrong booth.
- Scores kept in local storage or in the game's own table drift from what the booth card shows.
- A colour or font written in the game does not follow a change to the theme, so the booth stops matching the midway.

Do not report:

- Code outside `src/games/`. `src/carnival/` defines the theme and the scores module, and `src/midway/palette.ts` has its own scenery colours.
- Values derived from the theme, such as a colour with alpha added to a `theme.colors` value, or a size computed from `theme.canvas` or `theme.font`.
- Test data in `game.test.ts`.
- Anything lint, the type-checker or the tests already enforce. `src/games/index.test.ts` already fails when a game folder does not register or its `id` differs from the folder, so report those only when the change also stops the test from catching them.
- Rules 4 to 7, which other lenses and the rest of the review cover.

## Reporting

- Name the house rule, the file and line that breaks it, and what the player or the next author sees because of it.
- Point to the precedent in `src/games/water-cannon/game.ts`, and state the fix: the `theme` key or `canvasFont` call to use, where the single `recordScore` call goes, or the default export or `id` to change.
