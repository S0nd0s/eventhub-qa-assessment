import path from 'node:path';

// Load .env locally; in CI the values come from the environment (GitHub secrets).
try {
  process.loadEnvFile(path.resolve(__dirname, '../../.env'));
} catch {
  /* no .env file — rely on real environment variables */
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in (or set it as a CI secret).`);
  }
  return value;
}

export interface Credentials {
  email: string;
  password: string;
}

/**
 * The suite uses two permanent accounts:
 *  - primary:   does the booking work; tests run in parallel under it and only look at their own data
 *  - secondary: "another user" in isolation tests, and the clean account for visual baselines
 */
export type UserRole = 'primary' | 'secondary';

export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://eventhub.rahulshettyacademy.com',
  // Trailing slash matters: request paths are resolved relative to it.
  apiUrl: (process.env.API_URL ?? 'https://api.eventhub.rahulshettyacademy.com/api').replace(/\/?$/, '/'),
  credentials(role: UserRole): Credentials {
    return role === 'primary'
      ? { email: required('EVENTHUB_EMAIL'), password: required('EVENTHUB_PASSWORD') }
      : { email: required('EVENTHUB_EMAIL_2'), password: required('EVENTHUB_PASSWORD_2') };
  },
};

const authDir = path.resolve(__dirname, '../../.auth');

/** Where the auth setup project stores each user's session. Git-ignored. */
export const authFiles = {
  storageState: (role: UserRole) => path.join(authDir, `${role}.json`),
  token: (role: UserRole) => path.join(authDir, `${role}.token.json`),
};

/** The app keeps its JWT in localStorage under this key. */
export const TOKEN_STORAGE_KEY = 'eventhub_token';

/** A browser storage state that makes the app start logged in with the given token. */
export function storageStateFor(token: string) {
  return {
    cookies: [],
    origins: [{ origin: new URL(env.baseUrl).origin, localStorage: [{ name: TOKEN_STORAGE_KEY, value: token }] }],
  };
}
