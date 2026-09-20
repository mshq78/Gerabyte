import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/** promisify() drops the options overload, so wrap it by hand. */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derived) =>
      err ? reject(err) : resolve(derived)
    );
  });
}

/**
 * argon2id is the primary KDF. If the native binding cannot load — some
 * serverless runtimes ship a libc the prebuilt binary does not match — we fall
 * back to scrypt with parameters at the high end of the Node defaults rather
 * than refusing to start. `describeHasher()` reports which one is live so the
 * health endpoint and the report can state it plainly.
 */
const ARGON2_OPTIONS = {
  // OWASP's 2024 second recommendation: 19 MiB, t=2, p=1.
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

const SCRYPT_PARAMS = { N: 2 ** 16, r: 8, p: 1, keylen: 64, maxmem: 160 * 1024 * 1024 };

type Argon2Module = {
  hash: (password: string, options?: unknown) => Promise<string>;
  verify: (hash: string, password: string, options?: unknown) => Promise<boolean>;
  Algorithm: { Argon2id: number };
};

let argon2: Argon2Module | null = null;
let argon2Checked = false;

async function loadArgon2(): Promise<Argon2Module | null> {
  if (argon2Checked) return argon2;
  argon2Checked = true;
  try {
    const mod = (await import('@node-rs/argon2')) as unknown as Argon2Module;
    // Prove the native binding actually runs before trusting it.
    const probe = await mod.hash('probe', { ...ARGON2_OPTIONS, algorithm: mod.Algorithm.Argon2id });
    if (!(await mod.verify(probe, 'probe'))) throw new Error('argon2 self-check failed');
    argon2 = mod;
  } catch {
    argon2 = null;
  }
  return argon2;
}

export async function describeHasher(): Promise<'argon2id' | 'scrypt'> {
  return (await loadArgon2()) ? 'argon2id' : 'scrypt';
}

function encodeScrypt(salt: Buffer, derived: Buffer): string {
  const { N, r, p } = SCRYPT_PARAMS;
  return `$scrypt$N=${N},r=${r},p=${p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

async function hashWithScrypt(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_PARAMS.keylen, SCRYPT_PARAMS);
  return encodeScrypt(salt, derived);
}

async function verifyScrypt(hash: string, password: string): Promise<boolean> {
  const parts = hash.split('$');
  // ['', 'scrypt', 'N=..,r=..,p=..', saltB64, derivedB64]
  if (parts.length !== 5 || parts[1] !== 'scrypt') return false;
  const params = Object.fromEntries(
    (parts[2] ?? '').split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k ?? '', Number(v)];
    })
  ) as { N: number; r: number; p: number };
  const salt = Buffer.from(parts[3] ?? '', 'base64');
  const expected = Buffer.from(parts[4] ?? '', 'base64');
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = await scrypt(password, salt, expected.length, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: SCRYPT_PARAMS.maxmem,
  });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export async function hashPassword(password: string): Promise<string> {
  const mod = await loadArgon2();
  if (mod) {
    return mod.hash(password, { ...ARGON2_OPTIONS, algorithm: mod.Algorithm.Argon2id });
  }
  return hashWithScrypt(password);
}

/**
 * Verify a password against a stored hash. Never throws on a malformed hash:
 * a broken row must read as "wrong password", not as a 500.
 */
export async function verifyPassword(hash: string | null, password: string): Promise<boolean> {
  if (!hash) return false;
  try {
    if (hash.startsWith('$argon2')) {
      const mod = await loadArgon2();
      if (!mod) return false;
      return await mod.verify(hash, password);
    }
    if (hash.startsWith('$scrypt$')) return await verifyScrypt(hash, password);
    return false;
  } catch {
    return false;
  }
}
