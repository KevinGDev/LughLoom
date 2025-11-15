import { Injectable } from '@angular/core';
import { environments } from '../environments/environments';

export interface UserConfig {
  ollamaUrl: string;
  model: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {

  private readonly storageKey = 'userConfig';
  private config: UserConfig = {
    ollamaUrl: environments.ollamaUrl,
    model: environments.model
  };

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) this.config = JSON.parse(saved);
  }

  getConfig(): UserConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<UserConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(this.storageKey, JSON.stringify(this.config));
  }
}
