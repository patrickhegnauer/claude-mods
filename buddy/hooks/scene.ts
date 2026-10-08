import type { BuddyActivityKind } from '../types'

const FUR = '#ffffff'
const INK = '#1b1f2a'
const BAMBOO = '#4fa86b'
const LEAF = '#7cc48d'

const blink =
  '<animate attributeName="ry" values="2.8;2.8;0.3;2.8" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/>'

const eyes = (kind: BuddyActivityKind): string => {
  const patches = `<ellipse cx="110" cy="68" rx="6.5" ry="8.5" fill="${INK}" transform="rotate(20 110 68)"/><ellipse cx="130" cy="68" rx="6.5" ry="8.5" fill="${INK}" transform="rotate(-20 130 68)"/>`

  if (kind === 'done') {
    return `${patches}<path d="M107 69 q3.5 -4.5 7 0 M126 69 q3.5 -4.5 7 0" fill="none" stroke="${FUR}" stroke-width="2" stroke-linecap="round"/>`
  }

  const look =
    kind === 'thinking'
      ? '<animateTransform attributeName="transform" type="translate" values="0 0;1.5 -2;1.5 -2;0 0" keyTimes="0;0.2;0.8;1" dur="3s" repeatCount="indefinite"/>'
      : kind === 'reading' || kind === 'searching'
        ? '<animateTransform attributeName="transform" type="translate" values="-1.5 1;1.5 1;-1.5 1" dur="1.6s" repeatCount="indefinite"/>'
        : ''

  return `${patches}<g fill="${FUR}">${look}<ellipse cx="111" cy="68" rx="2.8" ry="2.8">${blink}</ellipse><ellipse cx="129" cy="68" rx="2.8" ry="2.8">${blink}</ellipse></g>`
}

const mouth = (kind: BuddyActivityKind): string => {
  const d =
    kind === 'done'
      ? 'M113 80 q7 8 14 0 z'
      : kind === 'idle'
        ? 'M115 81 q5 4 10 0'
        : kind === 'thinking'
          ? 'M117 83 h6'
          : 'M116 82 q4 3 8 0'

  return `<ellipse cx="120" cy="77" rx="3.2" ry="2.2" fill="${INK}"/><path d="${d}" fill="${kind === 'done' ? INK : 'none'}" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
}

const paw = (x: number, y: number, shoulderX: number, motion: string, held = ''): string =>
  `<g>${motion}${held}<line x1="${shoulderX}" y1="106" x2="${x}" y2="${y}" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="6.5" fill="${INK}"/></g>`

const tapping = (dur: string, begin: string): string =>
  `<animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`

const stalk = (x1: number, y1: number, x2: number, y2: number): string => {
  const joints = [0.3, 0.6]
    .map(t => {
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t

      return `<circle cx="${x}" cy="${y}" r="1.4" fill="#2f7a48"/>`
    })
    .join('')

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BAMBOO}" stroke-width="5" stroke-linecap="round"/>${joints}`
}

// Idle runs a 14s loop: paws on the desk, then a bamboo snack for the second half.
const SNACK_CYCLE = 'dur="14s" repeatCount="indefinite"'
const resting = `<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.45;0.5;0.95;1" ${SNACK_CYCLE}/>`
const snacking = `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.45;0.5;0.95;1" ${SNACK_CYCLE}/>`
const munch =
  '<animateTransform attributeName="transform" type="translate" values="0 0;-2 -1;0 0" dur="0.45s" repeatCount="indefinite"/>'
const snack = `${stalk(160, 100, 122, 82)}<path d="M160 100 q10 -8 16 -2 q-8 6 -16 2 z M156 98 q4 -12 12 -12 q-2 10 -12 12 z" fill="${LEAF}"/>`

const arms = (kind: BuddyActivityKind): string => {
  if (kind === 'done') {
    const wave =
      '<animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.6s" repeatCount="indefinite"/>'

    return paw(78, 80, 98, wave) + paw(162, 80, 142, wave)
  }

  if (kind === 'thinking') {
    return paw(86, 124, 98, '') + paw(134, 88, 142, '')
  }

  if (kind === 'idle') {
    return (
      paw(86, 124, 98, '') +
      `<g>${resting}${paw(154, 124, 142, '')}</g>` +
      `<g opacity="0">${snacking}${paw(148, 96, 142, munch, snack)}</g>`
    )
  }

  const dur = kind === 'typing' ? '0.26s' : kind === 'running' ? '0.5s' : ''
  const left = dur === '' ? '' : tapping(dur, '0s')
  const right = dur === '' ? '' : tapping(dur, kind === 'typing' ? '0.13s' : '0.25s')

  return paw(86, 124, 98, left) + paw(154, 124, 142, right)
}

const fadeDots = [0, 1, 2]
  .map(
    i =>
      `<circle cx="${176 + i * 10}" cy="30" r="3" fill="${INK}"><animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin="${i * 0.3}s" repeatCount="indefinite"/></circle>`,
  )
  .join('')

const bubbleText = (text: string): string =>
  `<text x="186" y="36" text-anchor="middle" font-family="ui-monospace,Consolas,Menlo,monospace" font-size="16" font-weight="700" fill="${INK}">${text}</text>`

const bubble = (kind: BuddyActivityKind): string => {
  if (kind === 'idle') {
    return ''
  }

  const tail =
    kind === 'thinking'
      ? '<circle cx="150" cy="52" r="3" fill="#fff"/><circle cx="158" cy="44" r="4.5" fill="#fff"/>'
      : '<path d="M164 40 l-14 14 l22 -8 z" fill="#fff"/>'

  const inside =
    kind === 'thinking'
      ? fadeDots
      : kind === 'typing'
        ? bubbleText('&lt;/&gt;')
        : kind === 'reading'
          ? [24, 30, 36]
              .map(
                (y, i) =>
                  `<rect x="170" y="${y}" width="32" height="3" rx="1.5" fill="${INK}"><animate attributeName="width" values="0;32;32" keyTimes="0;0.5;1" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/></rect>`,
              )
              .join('')
          : kind === 'searching'
            ? `<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"><animateTransform attributeName="transform" type="translate" values="-6 0;6 2;0 -3;-6 0" dur="2s" repeatCount="indefinite"/><circle cx="184" cy="28" r="7"/><line x1="189" y1="33" x2="196" y2="40"/></g>`
            : kind === 'running'
              ? bubbleText(
                  '&gt;<tspan>_<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="0.9s" repeatCount="indefinite"/></tspan>',
                )
              : kind === 'delegating'
                ? `<g fill="${INK}"><circle cx="176" cy="26" r="4"/><rect x="170" y="32" width="12" height="7" rx="3"/><circle cx="196" cy="26" r="4"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite"/></circle><rect x="190" y="32" width="12" height="7" rx="3"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite"/></rect></g>`
                : '<path d="M174 31 l8 8 l14 -16" fill="none" stroke="#2fa866" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'

  return `<g>${tail}<ellipse cx="186" cy="30" rx="30" ry="18" fill="#fff"/>${inside}</g>`
}

const sparkles = (
  [
    [60, 40, '#f5b700', 0],
    [84, 22, '#ef6f6c', 0.3],
    [150, 78, '#3aa7c9', 0.6],
    [40, 78, '#4fa86b', 0.9],
  ] as const
)
  .map(
    ([x, y, color, begin]) =>
      `<circle cx="${x}" cy="${y}" r="3" fill="${color}"><animate attributeName="r" values="0;4;0" dur="1.2s" begin="${begin}s" repeatCount="indefinite"/></circle>`,
  )
  .join('')

const steam = [48, 54]
  .map(
    (x, i) =>
      `<path d="M${x} 110 q-3 -5 0 -9 q3 -4 0 -8" fill="none" stroke="#7d9484" stroke-width="1.6" stroke-linecap="round"><animate attributeName="opacity" values="0;0.8;0" dur="2.4s" begin="${i * 0.8}s" repeatCount="indefinite"/></path>`,
  )
  .join('')

const grove = `${stalk(198, 116, 196, 74)}${stalk(205, 116, 207, 66)}<path d="M196 76 q-12 -4 -14 -14 q12 2 14 14 z M207 68 q10 -6 18 -2 q-8 8 -18 2 z M206 84 q10 -2 14 6 q-10 2 -14 -6 z" fill="${LEAF}"/>`

/** The panda at their desk, drawn for one activity; animated with SMIL only. */
export const scene = (kind: BuddyActivityKind): string => {
  const isBusy = kind !== 'idle' && kind !== 'done'
  const glow = isBusy
    ? '<rect x="100" y="104" width="40" height="22" rx="2" fill="#7bdff2"><animate attributeName="opacity" values="0.25;0.6;0.25" dur="1.1s" repeatCount="indefinite"/></rect>'
    : ''
  const breathe =
    '<animateTransform attributeName="transform" type="translate" values="0 0;0 1.2;0 0" dur="3.2s" repeatCount="indefinite"/>'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">
<rect width="240" height="180" rx="14" fill="#d9ecd6"/>
<rect x="16" y="18" width="52" height="40" rx="4" fill="#bfe3f2"/><circle cx="54" cy="32" r="6" fill="#ffd95e"/>
<line x1="42" y1="18" x2="42" y2="58" stroke="#d9ecd6" stroke-width="2"/>
${kind === 'done' ? sparkles : ''}
<g>${breathe}
<rect x="92" y="92" width="56" height="48" rx="18" fill="${INK}"/><ellipse cx="120" cy="118" rx="17" ry="20" fill="${FUR}"/>
<circle cx="101" cy="47" r="9.5" fill="${INK}"/><circle cx="139" cy="47" r="9.5" fill="${INK}"/>
<circle cx="120" cy="67" r="24" fill="${FUR}" stroke="#c9d6cc" stroke-width="1"/>
${eyes(kind)}${mouth(kind)}
</g>
<rect x="10" y="130" width="220" height="10" rx="3" fill="#b07a4a"/>
<rect x="22" y="140" width="8" height="40" fill="#8a5d36"/><rect x="210" y="140" width="8" height="40" fill="#8a5d36"/>
<rect x="42" y="114" width="16" height="16" rx="3" fill="#ef6f6c"/><path d="M58 118 q7 0 7 5 q0 5 -7 4" fill="none" stroke="#ef6f6c" stroke-width="3"/>${steam}
${grove}<rect x="190" y="114" width="24" height="16" rx="3" fill="#d98e5f"/>
<rect x="96" y="100" width="48" height="30" rx="3" fill="#aeb8c9"/>${glow}<circle cx="120" cy="115" r="3" fill="#7f8aa0"/>
<rect x="88" y="128" width="64" height="4" rx="2" fill="#8f9ab0"/>
${arms(kind)}
${bubble(kind)}
</svg>`
}

const FACES: Record<BuddyActivityKind, readonly [string, string]> = {
  idle: ['@ @', '@ @'],
  thinking: ['@ @', '° °'],
  typing: ['@ @', '@ @'],
  reading: ['<@<', '>@>'],
  searching: ['@ O', 'O @'],
  running: ['@ @', '- -'],
  delegating: ['@ @', '^ ^'],
  done: ['^ ^', '^ ^'],
}

const SAYS: Record<BuddyActivityKind, readonly [string, string]> = {
  idle: ['', ''],
  thinking: ['( .  )', '( ...)'],
  typing: ['</>', '{ }'],
  reading: ['[==  ]', '[====]'],
  searching: ['(o)-', '-(o)'],
  running: ['>_', '> '],
  delegating: ['((·))', '( · )'],
  done: ['\\o/ done!', ' o  done!'],
}

/** The same panda in character cells, for a surface with no `Svg`. */
export const ascii = (kind: BuddyActivityKind, frame: number): string[] => {
  const step = frame % 2 === 0 ? 0 : 1
  const isSnacking = kind === 'idle' && frame % 30 >= 15
  const isBlinking = kind === 'idle' && frame % 8 === 7
  const face = isBlinking ? '- -' : FACES[kind][step]
  const hands =
    kind === 'done'
      ? ['\\', '/']
      : kind === 'typing' || kind === 'running'
        ? step === 0
          ? ['_', '-']
          : ['-', '_']
        : ['_', '_']
  const chin = isSnacking
    ? `    \\  ${step === 0 ? 'o' : '-'}=|==|=<  nom`
    : `    \\  ${kind === 'done' ? 'v' : '-'}  /   c[_]`

  return [`   O.-"""-.O   ${SAYS[kind][step]}`, `   (  ${face}  )`, chin, `  ${hands[0]}/ [=====] \\${hands[1]}`, ' =================']
}
