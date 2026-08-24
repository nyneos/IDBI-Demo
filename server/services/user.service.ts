import { UserRepository } from '../repositories/user.repository.js';
import type { UserNameData } from '../models/user.model.js';
import { config } from '../config/config.js';

export class UserService {
  constructor(private readonly repo = new UserRepository()) {}

  async getUserName(): Promise<UserNameData> {
    const userName = await this.repo.getUserName();
    return { userName };
  }

  async saveUserName(userName: string): Promise<UserNameData> {
    const saved = await this.repo.saveUserName(userName);
    return { userName: saved };
  }

  getSseIntervalMs(): number {
    return config.sseIntervalMs;
  }
}
