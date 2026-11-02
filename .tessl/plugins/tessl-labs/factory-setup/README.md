# Factory setup

Set up a Tessl factory on your repository from your coding agent. A factory is a set of automations: when you hand Tessl a ticket, an agent in Tessl's cloud opens a pull request for it, answers the reviews and fixes failing checks on that pull request, and Code Review reviews every push.

## Get started

You can set up your factory in the Tessl web app. To use your coding agent
instead, follow the prompt below.

Ask your coding agent:

```text
Install the Tessl factory setup plugin with `tessl install --global tessl-labs/factory-setup`, then help me set up my software factory.
```

For an EU account, use this prompt instead:

```text
Install the Tessl factory setup plugin with `tessl --region eu install --global tessl-labs/factory-setup`, then help me set up my software factory in the EU. Keep every Tessl command in that region and use GitHub issues.
```

EU factories use GitHub issues; Linear is available only in the US. Both
regions use the same plugin. Installation requires a published version in
the selected region's registry.

The agent sets up the same factory as the Tessl web app, asking only for what you have to do yourself, such as installing the Tessl GitHub App. It then offers a first ticket and suggests what else would help your repository.

## Skills

- **factory-setup:** set up the factory.
- **prepare-repo:** improve your repository's agent context, checks, and review rules from how your team already works.
- **understand-factory:** see what the factory has done and why a run failed or never started.
- **change-factory:** change or extend a factory that's already set up.
- **create-github-issue** and **create-linear-issue:** write an issue for the factory to build and hand it to Tessl, from your own GitHub or Linear account.
- **check-cloud-setup:** check a setup script on a Tessl cloud machine before it goes live.
- **write-factory-skill:** write a skill for an automation, or make a larger change to one, and check it before it merges.
