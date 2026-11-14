import fs from 'node:fs';
import path from 'node:path';
import { test as setup, request as playwrightRequest } from '@playwright/test';
import { env, authFiles, storageStateFor, UserRole } from '../src/config/env';
import { AuthApi } from '../src/api/auth.api';

/**
 * Runs once before every other project.
 * Logs each permanent user in through the API (fast, no browser) and saves:
 *  - a browser storage state, so UI tests start already logged in
 *  - the raw token, for the API clients
 * Tests never log in themselves.
 */
const roles: UserRole[] = ['primary', 'secondary'];

for (const role of roles) {
  setup(`authenticate ${role} user`, async () => {
    const context = await playwrightRequest.newContext({ baseURL: env.apiUrl });
    const token = await new AuthApi(context).loginOrRegister(env.credentials(role));
    await context.dispose();

    fs.mkdirSync(path.dirname(authFiles.token(role)), { recursive: true });
    fs.writeFileSync(authFiles.token(role), JSON.stringify({ token }));
    fs.writeFileSync(authFiles.storageState(role), JSON.stringify(storageStateFor(token)));
  });
}
