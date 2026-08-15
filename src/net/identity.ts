export interface PlayerIdentity {
  id: string;
  name: string;
}

const KEY = 'ilovedaisy.player';
const NAMES = ['Daisy', 'Bumble', 'Peach', 'Comet', 'Biscuit', 'Sunny', 'Nova', 'Pixie'];

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

let cachedIdentity: PlayerIdentity | null = null;

export function getIdentity(): PlayerIdentity {
  if (cachedIdentity) return cachedIdentity;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as PlayerIdentity;
      if (p.id && p.name) {
        cachedIdentity = p;
        return p;
      }
    }
  } catch {
    /* ignore */
  }
  const fresh = { id: randomId(), name: randomName() };
  cachedIdentity = fresh;
  try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch {}
  return fresh;
}

export function saveIdentity(patch: Partial<PlayerIdentity>) {
  let current: PlayerIdentity;
  try {
    const raw = localStorage.getItem(KEY);
    current = raw ? (JSON.parse(raw) as PlayerIdentity) : { id: randomId(), name: randomName() };
  } catch {
    current = { id: randomId(), name: randomName() };
  }
  const next = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
