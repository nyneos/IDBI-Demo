import { UserRepository } from '../repositories/user.repository.js';
import type { UserNameResponse } from '../models/user.model.js';
import { config } from '../config/config.js';

export class UserService {
  constructor(private readonly repo = new UserRepository()) {}

  async getUserName(): Promise<UserNameResponse> {
    const userName = await this.repo.getUserName();
    return { userName };
  }

  getSseIntervalMs(): number {
    return config.sseIntervalMs;
  }
}
