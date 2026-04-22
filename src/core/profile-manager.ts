import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Profile {
  id: string;
  name: string;
  email: string;
  sshKey?: string;
  signCommits?: boolean;
}

export class ProfileManager {
  private configPath: string;

  constructor() {
    const configDir = path.join(os.homedir(), '.git-mod');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    this.configPath = path.join(configDir, 'profiles.json');
  }

  getProfiles(): Profile[] {
    if (!fs.existsSync(this.configPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading profiles:', error);
      return [];
    }
  }

  saveProfile(profile: Profile) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    
    if (index !== -1) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }

    fs.writeFileSync(this.configPath, JSON.stringify(profiles, null, 2));
  }

  deleteProfile(id: string) {
    const profiles = this.getProfiles().filter(p => p.id !== id);
    fs.writeFileSync(this.configPath, JSON.stringify(profiles, null, 2));
  }
}
