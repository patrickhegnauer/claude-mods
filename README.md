# claude-mods

Mods for Claude Code (terminal and the desktop app's Code tab).

## buddy

A virtual colleague for your session: a panda at a desk, in a pane beside the conversation.

- **Asks first.** At the start of a session it asks "Want a virtual buddy this session?": in a row above the prompt in the terminal and the desktop app, in the buddy pane itself in VS Code.
- **Works along.** The panda thinks, types, reads, searches, runs commands and briefs colleagues as Claude does, with a one-line caption ("Reading notes.md..."), and cheers when the turn is done.
- **Snacks.** While idle it munches bamboo now and then.
- **Session summary.** Under the panda, 3 to 5 bullet points sum up the session so far: goal, what was done, decisions, open problems, next steps. It refreshes after every reply.
- **`/buddy`** calls the buddy to the desk or sends them home.

The desktop app draws an animated picture; a terminal draws a small ASCII panda. The VS Code panel cannot draw a mod's window yet: there `/buddy` answers in the conversation with the panda and a fresh session summary.

### Install

In a terminal Claude Code session, type:

```
/plugin install buddy --marketplace patrickhegnauer/claude-mods
```

Answer `y` to add the marketplace, then pick a scope (user scope makes it load in every session, the desktop app's included).

### Good to know

- Needs a recent Claude Code build with function-hook plugins (written against 2.1.293). The API is early access and may change between releases.
- The session summary costs one extra model request per turn over the session's transcript.

### Develop

```
claude --plugin-dir ./buddy
claude plugin validate ./buddy
claude plugin test ./buddy
```
