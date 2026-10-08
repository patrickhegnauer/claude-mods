import { expect, test } from 'claude-code/testing'
import type { Mounted } from 'claude-code/testing'

const SCROLL = { offset: 0, bodyRows: 12 }
const BAND = {
  plugin: 'buddy',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80, scroll: SCROLL, view: {} },
} as const
const PANE = {
  plugin: 'buddy',
  component: 'Pane',
  requestId: 'buddy',
  props: { title: 'Buddy', isFocused: false, bodyColumns: 40, placement: 'dock', scroll: SCROLL, view: {} },
} as const

test('Yes seats the buddy with a session summary, and they work along with a tool call', async ($, on) => {
  const opened: string[] = []
  const during: (string | undefined)[] = []
  const panes: { terminal?: Mounted<'terminal', 'Pane'>; desktop?: Mounted<'desktop', 'Pane'> } = {}

  on('ui.open', (_$, e) => {
    opened.push(e.id)

    return { value: { isPlaced: true as const } }
  })

  on('model.fork', () => ({
    value: {
    isAnswered: true as const,
    text: 'Here you go:\n- Built the buddy mod.\n- **Tests** pass.\n- Next: pick a name.',
    usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  }))

  on('tool.call', async () => {
    during.push((await panes.terminal?.find({ type: 'Text', text: /notes\.md/ }))?.text)
    during.push((await panes.desktop?.find({ type: 'Text', text: /notes\.md/ }))?.text)

    return { result: 'ok', text: 'ok' }
  })

  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await band.find({ type: 'Text', text: /virtual buddy/ })).toBeDefined()
  await band.press({ key: 'yes' })
  expect(opened).toEqual(['buddy'])

  const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  panes.terminal = terminal
  panes.desktop = desktop
  expect(await terminal.find({ text: /Ready when you are/ })).toBeDefined()
  for (const pane of [terminal, desktop]) {
    expect(await pane.find({ type: 'Text', text: 'Session summary' })).toBeDefined()
    expect((await pane.findAll({ type: 'Text', text: /^- / })).map(found => found.text)).toEqual([
      '- Built the buddy mod.',
      '- Tests pass.',
      '- Next: pick a name.',
    ])
  }
  expect((await desktop.find({ type: 'Svg' }))?.props.alt).toMatch(/Ready when you are/)

  await $.tool.call({ tool: 'Read', tool_use_id: 't1', file_path: '/work/notes.md' })
  expect(during).toEqual(['Reading notes.md...', 'Reading notes.md...'])
  expect(await desktop.find({ type: 'Text', text: /Thinking/ })).toBeDefined()
})

test('where no band is drawn (VS Code), the pane asks and Yes seats the buddy', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('model.fork', () => ({ value: { isAnswered: false as const, reason: 'nothing-to-fork' as const } }))

  const pane = await $.ui.mount({ ...PANE, surface: 'vscode' })
  expect(await pane.find({ type: 'Text', text: /virtual buddy/ })).toBeDefined()
  expect(await pane.find({ type: 'Svg' })).toBeUndefined()

  await pane.press({ key: 'yes' })
  expect(await pane.find({ key: 'yes' })).toBeUndefined()
  expect((await pane.find({ type: 'Svg' }))?.props.alt).toMatch(/Ready when you are/)
  expect(await pane.find({ type: 'Text', text: 'Session summary' })).toBeDefined()
})
