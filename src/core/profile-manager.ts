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

export interface PathMapping {
  path: string;
  profileId: string;
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
    
    // Also cleanup mappings
    const mappings = this.getPathMappings().filter(m => m.profileId !== id);
    this.savePathMappings(mappings);
  }

  getPathMappings(): PathMapping[] {
    const mappingPath = path.join(path.dirname(this.configPath), 'mappings.json');
    if (!fs.existsSync(mappingPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  savePathMappings(mappings: PathMapping[]) {
    const mappingPath = path.join(path.dirname(this.configPath), 'mappings.json');
    fs.writeFileSync(mappingPath, JSON.stringify(mappings, null, 2));
  }

  getProfileByPath(currentPath: string): string | null {
    const mappings = this.getPathMappings();
    const normalizedPath = path.resolve(currentPath).toLowerCase();
    
    // Find the most specific (longest) path that matches
    const matches = mappings.filter(m => normalizedPath.startsWith(path.resolve(m.path).toLowerCase()));
    if (matches.length === 0) return null;
    
    return matches.sort((a, b) => b.path.length - a.path.length)[0].profileId;
  }
}
