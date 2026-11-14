import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { Credentials } from '../config/env';
import { RETRIES } from './retry';

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  loginRaw(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('auth/login', { data: credentials, maxRetries: RETRIES });
  }

  registerRaw(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('auth/register', { data: credentials });
  }

  /** Registers a brand-new account and returns its token. */
  async register(credentials: Credentials): Promise<string> {
    const response = await this.registerRaw(credentials);
    expect(response.status(), `register failed: ${await response.text()}`).toBe(201);
    return (await response.json()).token;
  }

  /**
   * Logs in, creating the account first if it does not exist yet.
   */
  async loginOrRegister(credentials: Credentials): Promise<string> {
    let response = await this.loginRaw(credentials);
    if (!response.ok()) response = await this.registerRaw(credentials);
    expect(response.ok(), `could not log in or register ${credentials.email}: ${response.status()} ${await response.text()}`).toBeTruthy();
    return (await response.json()).token;
  }
}
