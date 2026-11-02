# Regional setup

Use the same plugin in both regions. Keep every Tessl command, including
login and plugin installation, in the region of the person's account.

- An EU account uses `eu.tessl.io`. For an EU setup, pass `--region eu` on
  every `tessl` command, including commands in linked references. The flag
  selects that command's region. A successful EU login also replaces the
  saved session and sets the saved default region to EU; environment and
  repository pins can override that default. Explain this before asking the
  person to log in. Leave repository region pins and other saved settings
  unchanged.
- Keep an existing region choice. Use the person's account URL or the
  selected region in their request, CLI invocation, or `tessl.json`. If those
  disagree, ask which account to use before creating anything. If the region
  is unknown, ask which Tessl site they use; do not infer it from geography.
- Use the `webUrl` values returned by commands for browser links. EU links
  stay on `eu.tessl.io`; a link to the other region is a reason to stop and
  check the selection, not to move the setup there.
- EU factories use GitHub issues. Do not query Linear integrations, ask for
  a Linear connection or token, route a Linear team, or create Linear
  triggers. Linear is unavailable in the EU. If the person asks for it,
  explain the limitation and offer GitHub issues in the same region.
- In the US, keep the existing choice: Linear when connected and routed to
  the project, otherwise GitHub issues. When the project already takes
  tickets, setup refuses, as [Ticket to PR](set-up-in-tessl.md#ticket-to-pr)
  says. If an EU project reports a Linear intake Loop, stop and report
  the mismatch instead of adding a second intake Loop or changing regions.

If the plugin has no published version in the selected registry, report that
availability gap. Do not install from the other region to work around it.
