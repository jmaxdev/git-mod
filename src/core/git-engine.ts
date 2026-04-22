import { simpleGit, SimpleGit } from 'simple-git';

export interface BranchInfo {
  name: string;
  isMerged: boolean;
  isGone: boolean;
  isCurrent: boolean;
}

export class GitEngine {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit({
      unsafe: {
        allowUnsafeSshCommand: true
      }
    });
  }

  async getBranches(): Promise<BranchInfo[]> {
    // Get all local branches with verbosity to see tracking info
    const branchData = await this.git.branch(['-vv']);
    const currentBranch = branchData.current;

    // Get merged branches (to main/master)
    let mergedSet = new Set<string>();
    let mainBranch = '';
    try {
      mainBranch = await this.findMainBranch();
      const mergedBranchesRaw = await this.git.branch(['--merged', mainBranch]);
      mergedSet = new Set(Object.keys(mergedBranchesRaw.branches));
    } catch (e) {
      // In empty repos or when main doesn't exist yet, we just skip merged info
    }

    const branches: BranchInfo[] = [];

    for (const name of Object.keys(branchData.branches)) {
      const info = branchData.branches[name];
      const isGone = info.label?.includes(': gone]') || false;
      const isMerged = mergedSet.has(name) && name !== mainBranch;
      
      branches.push({
        name,
        isMerged,
        isGone,
        isCurrent: name === currentBranch
      });
    }

    return branches;
  }

  private async findMainBranch(): Promise<string> {
    const branches = await this.git.branch();
    if (branches.branches['main']) return 'main';
    if (branches.branches['master']) return 'master';
    return branches.current || 'main';
  }

  async deleteBranches(names: string[]) {
    for (const name of names) {
      await this.git.deleteLocalBranch(name, true); // Force delete since we confirmed
    }
  }

  async getReflog(limit: number = 20): Promise<any[]> {
    const log = await this.git.raw(['reflog', `-${limit}`]);
    return log.split('\n').filter(Boolean).map(line => {
      const match = line.match(/^([a-f0-9]+)\s+(HEAD@\{(\d+)\}):\s+(.*)$/);
      if (match) {
        return {
          hash: match[1],
          ref: match[2],
          index: match[3],
          description: match[4]
        };
      }
      return null;
    }).filter(Boolean);
  }

  async restoreState(hash: string, mode: 'reset' | 'checkout', branchName?: string) {
    if (mode === 'reset') {
      await this.git.reset(['--hard', hash]);
    } else if (mode === 'checkout' && branchName) {
      await this.git.checkout(['-b', branchName, hash]);
    }
  }

  async startBisect(badHash: string, goodHash: string) {
    await this.git.raw(['bisect', 'start']);
    await this.git.raw(['bisect', 'bad', badHash]);
    await this.git.raw(['bisect', 'good', goodHash]);
  }

  async bisectStep(result: 'good' | 'bad' | 'skip'): Promise<string> {
    const output = await this.git.raw(['bisect', result]);
    return output;
  }

  async resetBisect() {
    await this.git.raw(['bisect', 'reset']);
  }

  async getRecentCommits(limit: number = 20): Promise<any[]> {
    const log = await this.git.log({ maxCount: limit });
    return log.all.map(c => ({
      hash: c.hash,
      message: c.message,
      date: c.date
    }));
  }

  async getWorktrees(): Promise<any[]> {
    const output = await this.git.raw(['worktree', 'list', '--porcelain']);
    const worktrees: any[] = [];
    let current: any = {};

    output.split('\n').forEach(line => {
      if (line.startsWith('worktree ')) {
        if (current.path) worktrees.push(current);
        current = { path: line.substring(9).trim() };
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).trim().replace('refs/heads/', '');
      } else if (line.startsWith('HEAD ')) {
        current.head = line.substring(5).trim();
      }
    });
    if (current.path) worktrees.push(current);
    return worktrees;
  }

  async addWorktree(path: string, branch: string) {
    await this.git.raw(['worktree', 'add', path, branch]);
  }

  async removeWorktree(path: string) {
    await this.git.raw(['worktree', 'prune']); // Pre-prune to be safe
    await this.git.raw(['worktree', 'remove', path]);
  }

  async setConfig(key: string, value: string, scope: 'local' | 'global' = 'local') {
    const scopeFlag = scope === 'global' ? '--global' : '--local';
    await this.git.raw(['config', scopeFlag, '--replace-all', key, value]);
  }

  async getLocalConfig(key: string): Promise<string | null> {
    try {
      return await this.git.getConfig(key, 'local').then(res => res.value);
    } catch {
      return null;
    }
  }

  async setSSHCommand(sshKeyPath: string, scope: 'local' | 'global' = 'local') {
    // Use -F /dev/null to ignore user's ~/.ssh/config and only use the specified key
    // This is safer for specific repository identities
    const command = `ssh -i "${sshKeyPath.replace(/\\/g, '/')}" -o "IdentitiesOnly=yes" -F /dev/null`;
    await this.setConfig('core.sshCommand', command, scope);
  }
}
