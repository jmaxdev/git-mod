import fs from 'fs';
import path from 'path';
import os from 'os';

export interface GitModConfig {
  autoPush?: boolean;
  tagAfterCommit?: boolean;
  defaultCoAuthors?: string[];
  autoSwitch?: boolean;
  autoChangelog?: 'always' | 'never' | 'ask';
}

export class ConfigManager {
  private configPath: string;
  private config: GitModConfig = {};

  constructor() {
    this.configPath = path.join(os.homedir(), '.gitmodrc');
    this.load();
  }

  private load() {
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(data);
      } catch (e) {
        this.config = {};
      }
    }
  }

  save() {
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  get<K extends keyof GitModConfig>(key: K): GitModConfig[K] {
    return this.config[key];
  }

  set<K extends keyof GitModConfig>(key: K, value: GitModConfig[K]) {
    this.config[key] = value;
    this.save();
  }

  getAll(): GitModConfig {
    return this.config;
  }
}
