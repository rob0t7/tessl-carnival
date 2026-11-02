# Whack-a-Mole

Whack the moles as they pop up from the nine holes, before they duck back down.

## How to play

- Moles pop up one at a time from a 3 by 3 grid of holes, stay up for a moment,
  then drop back down.
- Click a mole while it's up to whack it.
- The round lasts 30 seconds. Moles pop up faster, and stay up for less time, as
  the clock runs down: a new mole every 1 second at the start and every 0.35
  seconds at the end, staying up for 1.3 seconds at the start and 0.6 seconds at
  the end.
- Click again on the game over screen to play another round.

## Scoring

Each mole you whack scores 10 points. A click on an empty hole scores nothing
and costs nothing.

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `step`, `whack`, `spawnInterval`,
  `upTime`) and the `whackAMole` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
