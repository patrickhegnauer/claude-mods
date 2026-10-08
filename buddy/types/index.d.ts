export type BuddyMode = 'ask' | 'on' | 'off'

export type BuddyActivityKind =
  | 'idle'
  | 'thinking'
  | 'typing'
  | 'reading'
  | 'searching'
  | 'running'
  | 'delegating'
  | 'done'

export type BuddyActivity = { kind: BuddyActivityKind; label: string }

export type BuddySummary = { points: string[]; isUpdating: boolean }

declare module 'claude-code' {
  interface PluginState {
    buddy: { mode: BuddyMode; activity: BuddyActivity; frame: number; summary: BuddySummary }
  }
}
