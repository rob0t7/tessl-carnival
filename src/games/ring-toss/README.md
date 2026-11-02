# Ring Toss

Land rings on the necks of the bottles at the back of the booth.

## How to play

- Move the mouse to aim. The red cross shows where the ring will land, and it
  sways from side to side, so time your throw.
- Click to toss a ring. You throw one ring at a time, and the next one is ready
  when the last has landed.
- You have 8 rings. The round ends when the last ring has landed.
- Click again on the game over screen to play another round.

## Scoring

A ring scores when it lands within 14 px of the middle of a bottle neck. A
bottle can take more than one ring, and every ringer scores. Bottles further
back score more:

| Row    | Points |
| ------ | ------ |
| Back   | 30     |
| Middle | 20     |
| Front  | 10     |

Your final score is saved to the carnival's score board when the round ends.

## Files

- `game.ts`: the game logic (`createState`, `toss`, `step`, `sway`, `bottleAt`)
  and the `ringToss` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
