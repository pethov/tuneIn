const LS_KEY = 'tunein_user_id'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  let s = ''
  for (let i = 0; i < 16; i++)
    s += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  s = s.substring(0, 12) + '4' + s.substring(13)
  const v8 = parseInt(s[16], 16)
  s = s.substring(0, 16) + ((v8 & 0x3) | 0x8).toString(16) + s.substring(17)
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
}

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'server'

  try {
    let id = localStorage.getItem(LS_KEY)

    if (!id || !UUID_V4_RE.test(id)) {
      id = uuidv4()
      localStorage.setItem(LS_KEY, id)
    }
    return id
  } catch (err) {
    const id = uuidv4()
    console.warn('localStorage access failed, using ephemeral id:', err)
    return id
  }
}
