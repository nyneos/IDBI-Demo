import { UserRepository } from '../repositories/user.repository.js';
import type { LoginPayload } from '../models/user.model.js';
import { config } from '../config/config.js';

export class UserService {
  constructor(private readonly repo = new UserRepository()) {}

  async getPayload(): Promise<LoginPayload> {
    return this.repo.getPayload();
  }

  async savePayload(payload: LoginPayload): Promise<LoginPayload> {
    return this.repo.savePayload(payload);
  }

  getSseIntervalMs(): number {
    return config.sseIntervalMs;
  }
}
