# Hook a Duck

Rubber ducks float round a stream in a loop. Lower your hook onto one as it
passes to catch it.

## How to play

- Move the mouse to hold the rod over the stream, and click to cast. The hook
  drops to where you clicked, catches the duck there if there is one, and comes
  back up.
- One hook at a time: you can cast again once the hook is back up.
- You have 10 casts. The round ends when the last cast is back up.
- Click again on the game over screen to play another round.

## Scoring

Each duck has a number on its base, and catching it scores that number. The
eight ducks are numbered 10, 20, 10, 50, 10, 30, 10 and 20, in order round the
stream. A cast that catches nothing scores 0.

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `cast`, `step`, `duckUnderHook`) and
  the `hookADuck` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
