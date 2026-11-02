# What an automation can use

The pieces a `tessl.json` automation is built from, beyond the entries the
starters in [the triggers reference](triggers.md) use. Use this when writing
your own automation or changing what starts one. `tessl doctor --automations`
checks the file; run it after every change.

## Events

A trigger's `on` lists events written `<provider>:<event>`. Every event in one
trigger must be the same kind, the part before the first dot: `github:issues.opened`
and `github:issues.labeled` can share a trigger, `github:issues.labeled` and
`github:issue_comment.created` cannot.

**GitHub.** `github:<event>.<action>`, using GitHub's webhook event and action
names, such as `github:pull_request.labeled` or `github:release.published`;
`event.` reads GitHub's webhook payload for that event, such as
`event.release.tag_name` or `event.sender.type`. A run
starts only for events the Tessl App receives for the repository; the Event
delivery section of `tessl doctor --automations` says whether they arrive.
These kinds come with extras:

- **`issues`**: the `label` helper; runs on one issue take turns by default.
- **`issue_comment`**: the `isPullRequest` helper (`"true"` or `"false"`);
  runs on one issue or pull request take turns by default. Test for a mention
  with the `mentions` operator on `event.comment.body`.
- **`pull_request`, `pull_request_review`, `pull_request_review_comment`,
  `pull_request_review_thread`**: runs on one pull request take turns by
  default.
- **`check_run`, `check_suite`**: no default; a check on a branch has no pull
  request, so declare `concurrency.keys` that fit the trigger.
- **`release`**: runs on one release take turns by default.
- **`push`**: the `isDefaultBranch` helper (`"isDefaultBranch": "true"`); runs on
  one commit take turns by default.

Any other GitHub event can be used too, with no helpers and no default, so
declare its `concurrency.keys`.

**Linear** (US only). `linear:Issue.create`, `linear:Issue.update`,
`linear:Issue.remove` (with the `labelAdded` helper, which takes a label name
and holds when an update added that label), `linear:Comment.create`,
and the agent session events `linear:AgentSessionEvent.created` and
`linear:AgentSessionEvent.prompted`; `event.` reads Linear's webhook payload,
such as `event.data.team.key`. Runs on one issue take turns by default.

**Tessl.** `tessl:finding.created` fires when a finding is reported on the
project. `event.finding` has the fields `tessl finding view <id> --json` prints,
such as `event.finding.id`, and `event.project.id` is the project. Runs on
one finding take turns by default. A finding reported by a run that a
finding started fires nothing, so an automation cannot start itself in a loop.

**Schedules.** A `schedules` entry starts an action on a timetable instead of
an event, as [Scheduled job](starters.md#scheduled-job) says.

## Conditions

`when` holds conditions that must all hold. Each key is either a helper, with
a string value, or a path into the event, written `event.<field>.<field>`,
such as `event.pull_request.draft`. `*` in a path stands for every item of a
list, as in `event.pull_request.labels.*.name`.

A plain value means equals, compared as JSON: `false` and `"false"` differ,
so write a boolean or number as the payload has it. Otherwise the value is an
object of operators, all of which must hold:

- **`equals`**, **`in`** (a list of values), **`contains`**: compare with a
  value. The whole value may be a `{{ … }}` substitution, such as
  `{{ github.tesslApp.userId }}`.
- **`matches`**: an RE2 regular expression.
- **`mentions`**: a keyword such as `@tessl-app`, matched as a mention.
- **`exists`**: `true` when the path has a value; `exists: false` stands alone.
- **`not`**, **`any`**, **`none`**: wrap more operators; `any` and `none` test
  the items of a list. They nest at most 3 levels. For example,
  `"event.sender.type": { "not": { "equals": "Bot" } }` leaves out bots.

## Concurrency

`concurrency`, on a trigger or an action, says which runs take turns and how
events gather:

- **`keys`**: a list of `{ "key": "<template>", "limit": <n> }`, or plain
  strings, which mean `limit` 1; runs whose key renders the same hold at
  most `limit` at once. A key can read the action's inputs as
  `{{ inputs.<NAME> }}`. Keys on the action apply to every trigger that
  starts it; keys on a trigger apply to its own runs, and a run holds both.
  Declaring any keys replaces the event's default.
- **`debounce`**: from `1s` to `15m`; events whose keys match are gathered for
  that long, from the first, and start one run.
- **`mode`**: what an event does when a run on the same key is already
  waiting. `join` (the default) adds it to that run, `queue` gives it a run of
  its own after it, `skip` drops it.

## Action settings

Beyond `skill`, `environment`, `agent`, `model`, `instructions` and `inputs`,
an action can set:

- **`effort`**: `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`.
- **`timeout`**: a duration such as `45m`; without it, a run has 2 hours.
- **`baseBranch`**: the branch checked out before the run; without it, the
  default branch.
- **`workdir`**: the directory inside the repository the agent starts in.
- **`tags`**: labels the Loop is grouped by on the Loops page.
- **`overlays`**, **`selectOverlays`**, **`params`**: settings chosen from the
  run's inputs, as [the triggers reference](triggers.md) says.

A trigger or schedule can override `effort`, `timeout`, `baseBranch` and
`workdir` for its own runs, next to `use`, as it can `agent`, `model`,
`environment`, `instructions` and `inputs`. `tags`, `overlays`,
`selectOverlays` and `params` go on the action only.

## Environment settings

Beyond GitHub and Linear access, `tessl environment update <environment>`
takes:

- **`--remove-key <name>`**: removes one stored key and keeps the rest.
- **`--mcp-server <name>`**: wires a workspace MCP server into the
  environment, for workspace environments.
- **`--read-other-run-logs`**: lets runs read other runs' transcripts in the
  workspace; `--no-read-other-run-logs` turns it off.
