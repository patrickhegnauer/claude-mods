import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { BuddyActivity, BuddyActivityKind, BuddySummary } from '../types'
import { ascii, scene } from './scene'

const PANE = 'buddy'
const TITLE = 'Buddy'
const IDLE: BuddyActivity = { kind: 'idle', label: 'Ready when you are.' }
const THINKING: BuddyActivity = { kind: 'thinking', label: 'Thinking it through...' }

const mode = atom({ plugin: 'buddy', key: 'mode' } as const, 'ask')
const activity = atom({ plugin: 'buddy', key: 'activity' } as const, IDLE)
const frame = atom({ plugin: 'buddy', key: 'frame' } as const, 0)
const NO_SUMMARY: BuddySummary = { points: [], isUpdating: false }
const summary = atom({ plugin: 'buddy', key: 'summary' } as const, NO_SUMMARY)

const SUMMARY_PROMPT = `Write a management summary of this whole session so far, for the person who started it.
Give 3 to 5 bullet points, most important first, each one sentence of at most 20 words, in plain language and in the language the person writes in.
Cover what matters to them: the goal, what has been done, decisions taken, open problems and what comes next.
Reply with the bullets only, one per line, each starting with "- ". No heading, no closing remark.`

const pointsOf = (text: string): string[] =>
  text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^([-*•]|\d+[.)])\s+/.test(line))
    .map(line => line.replace(/^([-*•]|\d+[.)])\s+/, '').replace(/\*\*/g, ''))
    .slice(0, 5)

const TOOLS: Record<string, [BuddyActivityKind, string]> = {
  Edit: ['typing', 'Editing'],
  Write: ['typing', 'Writing'],
  NotebookEdit: ['typing', 'Editing'],
  Read: ['reading', 'Reading'],
  Grep: ['searching', 'Searching the code'],
  Glob: ['searching', 'Looking for files'],
  ToolSearch: ['searching', 'Looking for the right tool'],
  WebSearch: ['searching', 'Searching the web'],
  WebFetch: ['reading', 'Reading a web page'],
  Bash: ['running', 'Running a command'],
  PowerShell: ['running', 'Running a command'],
  Agent: ['delegating', 'Briefing a colleague'],
  Task: ['delegating', 'Briefing a colleague'],
}

const baseName = (path: unknown): string =>
  typeof path === 'string' ? (path.split(/[\\/]/).pop() ?? '') : ''

const activityFor = (e: { tool: unknown }): BuddyActivity => {
  const tool = String(e.tool)
  const known = TOOLS[tool]

  if (known === undefined) {
    return { kind: 'typing', label: tool.startsWith('mcp__') ? 'Using a tool...' : `Using ${tool}...` }
  }

  const file = baseName((e as Record<string, unknown>).file_path)

  return { kind: known[0], label: file === '' ? `${known[1]}...` : `${known[1]} ${file}...` }
}

let ticker: Timer | undefined
let rest: Timer | undefined

// Only the terminal's drawing reads `frame`; the desktop's SVG animates itself.
function startTicker($: EngineInterface): void {
  ticker ??= $.clock.every(450, () => void update($, frame, n => (n + 1) % 1000))
}

let summaryRun = 0

// One tool-less question over the session's own transcript; the newest run wins.
async function refreshSummary($: EngineInterface, latest: string): Promise<void> {
  const run = ++summaryRun
  await update($, summary, now => ({ ...now, isUpdating: true }))
  const prompt =
    latest === ''
      ? SUMMARY_PROMPT
      : `${SUMMARY_PROMPT}

The assistant's latest reply, in case the transcript above ends before it:
${latest.slice(0, 3000)}`
  const reply = await $.model.fork({ prompt }).catch(() => undefined)

  if (run !== summaryRun) {
    return
  }

  const points = reply?.isAnswered ? pointsOf(reply.text) : []
  await update($, summary, now => ({ points: points.length > 0 ? points : now.points, isUpdating: false }))
}

function stopTicker(): void {
  ticker?.cancel()
  ticker = undefined
}

// The band above the prompt is drawn on the terminal and the desktop only: on
// any other surface (VS Code, mobile) the pane itself asks the question.
function hasNoBand(surface: string): boolean {
  return surface !== 'terminal' && surface !== 'desktop'
}

async function seatBuddy($: EngineInterface, isWorking: boolean): Promise<void> {
  await update($, mode, () => 'on')

  if (isWorking) {
    await update($, activity, () => THINKING)
    startTicker($)
  }

  await $.ui.open({ id: PANE, title: TITLE })
  void refreshSummary($, '')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'buddy',
      description: 'Call your virtual buddy to the desk, or send them home',
    })

    const current = await read($, mode)
    const isAskingInPane = current === 'ask' && (await $.session.surfaces()).some(hasNoBand)

    if (current === 'on' || isAskingInPane) {
      void $.ui.open({ id: PANE, title: TITLE })
    }

    return next(e)
  })

  on('session.attach', async ($, e, next) => {
    if (hasNoBand(e.surface) && (await read($, mode)) === 'ask') {
      void $.ui.open({ id: PANE, title: TITLE })
    }

    return next(e)
  })

  on('command.run', { command: 'buddy' }, async $ => {
    if ((await read($, mode)) === 'on') {
      await update($, mode, () => 'off')
      await $.ui.close({ id: PANE })

      return { text: 'Buddy went home. /buddy brings them back.' }
    }

    await seatBuddy($, false)

    return { text: 'Buddy is at their desk.' }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    if (e.origin.kind === 'person') {
      await update($, mode, () => 'off')
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    rest?.cancel()

    if ((await read($, mode)) === 'on') {
      await update($, activity, () => THINKING)
      startTicker($)
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if ((await read($, mode)) !== 'on') {
      return next(e)
    }

    const doing = activityFor(e)
    await update($, activity, () => doing)
    const ran = await next(e)
    await update($, activity, now => (now === doing || now.label === doing.label ? THINKING : now))

    return ran
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && (await read($, mode)) === 'on') {
      stopTicker()
      await update($, activity, () => ({
        kind: 'done',
        label: e.isAborted ? 'Stopped. What next?' : 'Done! Have a look.',
      }))
      rest?.cancel()
      void refreshSummary($, e.answer)
      rest = $.clock.after(8000, () => void update($, activity, now => (now.kind === 'done' ? IDLE : now)))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, mode)) !== 'ask') {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const isWorking = e.props.isWorking

    return (
      <Box gap={1}>
        <Text>Want a virtual buddy this session?</Text>
        <Button
          key="yes"
          label="Yes"
          variant="primary"
          onPress={() => seatBuddy($, isWorking)}
        />
        <Button key="no" label="No" onPress={() => update($, mode, () => 'off')} />
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if ((await read($, mode)) === 'ask') {
      const { Box, Button, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="column" gap={1}>
          <Text>Want a virtual buddy this session?</Text>
          <Box gap={1}>
            <Button key="yes" label="Yes" variant="primary" onPress={() => seatBuddy($, false)} />
            <Button
              key="no"
              label="No"
              onPress={async () => {
                await update($, mode, () => 'off')
                await $.ui.close({ id: PANE })
              }}
            />
          </Box>
        </Box>
      )
    }

    const doing = await read($, activity)
    const { points, isUpdating } = await read($, summary)
    const { Box, Text } = $.ui.resolve(e)
    const brief = (
      <Box flexDirection="column">
        <Text bold>Session summary{isUpdating ? ' (updating...)' : ''}</Text>
        {points.length === 0 && (
          <Text dimColor>{isUpdating ? 'Reading back through the session...' : 'Appears after the first reply.'}</Text>
        )}
        {points.map(point => (
          <Text>- {point}</Text>
        ))}
      </Box>
    )

    if (e.surface === 'terminal') {
      const lines = ascii(doing.kind, await read($, frame))

      return (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column">
            {lines.map(line => (
              <Text wrap="truncate">{line}</Text>
            ))}
            <Text dimColor>{doing.label}</Text>
          </Box>
          {brief}
        </Box>
      )
    }

    const { Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column" alignItems="center">
          <Svg source={scene(doing.kind)} alt={`Your buddy at their desk: ${doing.label}`} width={240} isInteractive />
          <Text dimColor>{doing.label}</Text>
        </Box>
        {brief}
      </Box>
    )
  })
}
