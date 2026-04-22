import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { ProfileManager, Profile } from '../core/profile-manager.ts';
import { GitEngine } from '../core/git-engine.ts';

export async function profileCommand() {
  const profileManager = new ProfileManager();
  const engine = new GitEngine();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Git Identity Profiles:',
      choices: [
        { name: '👤 Use a profile in this repo', value: 'use' },
        { name: '➕ Add new profile', value: 'add' },
        { name: '🔍 Scan & Import keys (git_*)', value: 'import' },
        { name: '📋 List profiles', value: 'list' },
        { name: '🔑 Show Public Key', value: 'showKey' },
        { name: '❌ Delete profile', value: 'delete' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'use':
      await useProfile(profileManager, engine);
      break;
    case 'add':
      await addProfile(profileManager);
      break;
    case 'import':
      await importProfiles(profileManager);
      break;
    case 'list':
      await listProfiles(profileManager);
      break;
    case 'showKey':
      await showPublicKey(profileManager);
      break;
    case 'delete':
      await deleteProfile(profileManager);
      break;
  }
}

async function useProfile(manager: ProfileManager, engine: GitEngine) {
  const profiles = manager.getProfiles();
  if (profiles.length === 0) {
    console.log(chalk.yellow('\nNo profiles found. Create one first!'));
    return;
  }

  const { profileId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profileId',
      message: 'Select profile to apply to THIS repository:',
      choices: profiles.map(p => ({ name: `${p.id} (${p.name} <${p.email}>)`, value: p.id }))
    }
  ]);

  const { scope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Where do you want to apply this profile?',
      choices: [
        { name: '📂 Local (only this repository)', value: 'local' },
        { name: '🌎 Global (everywhere)', value: 'global' }
      ]
    }
  ]);

  const profile = profiles.find(p => p.id === profileId)!;
  const spinner = ora(`Applying profile ${scope}ly...`).start();

  try {
    await engine.setConfig('user.name', profile.name, scope as 'local' | 'global');
    await engine.setConfig('user.email', profile.email, scope as 'local' | 'global');
    if (profile.sshKey) {
      await engine.setSSHCommand(profile.sshKey, scope as 'local' | 'global');
      
      if (profile.signCommits) {
        await engine.setConfig('gpg.format', 'ssh', scope as 'local' | 'global');
        await engine.setConfig('user.signingkey', profile.sshKey, scope as 'local' | 'global');
        await engine.setConfig('commit.gpgsign', 'true', scope as 'local' | 'global');
      } else {
        await engine.setConfig('commit.gpgsign', 'false', scope as 'local' | 'global');
      }
    }
    spinner.succeed(chalk.green(`Profile '${profileId}' applied ${scope}ly.`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to apply profile: ${error.message}`));
  }
}

async function addProfile(manager: ProfileManager) {
  const basicInfo = await inquirer.prompt([
    { type: 'input', name: 'id', message: 'Profile ID (e.g., work, personal):', validate: input => !!input, filter: val => val.trim() },
    { type: 'input', name: 'name', message: 'Git user.name:', validate: input => !!input, filter: val => val.trim() },
    { type: 'input', name: 'email', message: 'Git user.email:', validate: input => !!input, filter: val => val.trim() }
  ]);

  const { sshAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sshAction',
      message: 'SSH Key configuration:',
      choices: [
        { name: '🆕 Generate a new SSH key for this profile', value: 'generate' },
        { name: '📂 Use an existing SSH key', value: 'existing' },
        { name: '⏭️ Skip SSH configuration', value: 'skip' }
      ]
    }
  ]);

  let sshKeyPath = '';

  if (sshAction === 'generate') {
    const defaultPath = path.join(os.homedir(), '.ssh', `git_id_ed25519_${basicInfo.id}`);
    const { customPath } = await inquirer.prompt([
      { type: 'input', name: 'customPath', message: 'Save key to:', default: defaultPath, filter: val => val.trim() }
    ]);
    
    sshKeyPath = customPath;
    const spinner = ora('Generating Ed25519 SSH key...').start();
    
    try {
      // Ensure .ssh directory exists
      const sshDir = path.dirname(sshKeyPath);
      if (!fs.existsSync(sshDir)) fs.mkdirSync(sshDir, { recursive: true });

      // Generate key without passphrase for the tool's ease of use
      execSync(`ssh-keygen -t ed25519 -C "${basicInfo.email}" -f "${sshKeyPath}" -N ""`, { stdio: 'ignore' });
      spinner.succeed(chalk.green('SSH Key generated successfully!'));

      const pubKey = fs.readFileSync(`${sshKeyPath}.pub`, 'utf-8');
      console.log(chalk.bold.cyan('\n📋 COPY THIS PUBLIC KEY TO GITHUB:'));
      console.log(chalk.gray('--------------------------------------------------'));
      console.log(pubKey.trim());
      console.log(chalk.gray('--------------------------------------------------'));
      console.log(chalk.dim('\nSettings > SSH and GPG keys > New SSH key (Select "Signing Key" for the "Verified" badge)\n'));
      
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to generate key: ${error.message}`));
      return;
    }
  } else if (sshAction === 'existing') {
    const { existingPath } = await inquirer.prompt([
      { type: 'input', name: 'existingPath', message: 'Path to existing Private Key:', filter: val => val.trim() }
    ]);
    sshKeyPath = existingPath;
  }

  let signCommits = false;
  if (sshKeyPath) {
    const { shouldSign } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldSign',
        message: 'Do you want to enable automatic commit signing with this SSH key?',
        default: true
      }
    ]);
    signCommits = shouldSign;
  }

  manager.saveProfile({
    ...basicInfo,
    sshKey: sshKeyPath || undefined,
    signCommits
  });

  console.log(chalk.green(`\n✅ Profile '${basicInfo.id}' saved successfully!`));
}

async function listProfiles(manager: ProfileManager) {
  const profiles = manager.getProfiles();
  if (profiles.length === 0) {
    console.log(chalk.yellow('\nNo profiles found.'));
    return;
  }

  console.log(chalk.bold.cyan('\nYour Profiles:'));
  profiles.forEach(p => {
    console.log(chalk.white(`- ${chalk.bold(p.id)}: ${p.name} <${p.email}>`));
    if (p.sshKey) console.log(chalk.dim(`  SSH Key: ${p.sshKey}`));
  });
  console.log('');
}

async function showPublicKey(manager: ProfileManager) {
  const profiles = manager.getProfiles().filter(p => !!p.sshKey);
  if (profiles.length === 0) {
    console.log(chalk.yellow('\nNo profiles found with SSH keys.'));
    return;
  }

  const { profileId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profileId',
      message: 'Select profile to show public key:',
      choices: profiles.map(p => ({ name: p.id, value: p.id }))
    }
  ]);

  const profile = profiles.find(p => p.id === profileId)!;
  const pubKeyPath = `${profile.sshKey}.pub`;

  if (fs.existsSync(pubKeyPath)) {
    const pubKey = fs.readFileSync(pubKeyPath, 'utf-8');
    console.log(chalk.bold.cyan(`\n📋 Public Key for '${profileId}':`));
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(pubKey.trim());
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(chalk.dim('\nSettings > SSH and GPG keys > New SSH key (Select "Signing Key" for the "Verified" badge)\n'));
  } else {
    console.log(chalk.red(`\nError: Public key file not found at ${pubKeyPath}`));
  }
}

async function importProfiles(manager: ProfileManager) {
  const sshDir = path.join(os.homedir(), '.ssh');
  if (!fs.existsSync(sshDir)) {
    console.log(chalk.yellow('\nNo .ssh directory found.'));
    return;
  }

  const files = fs.readdirSync(sshDir);
  const gitKeys = files.filter(f => f.startsWith('git_') && !f.endsWith('.pub'));

  if (gitKeys.length === 0) {
    console.log(chalk.yellow('\nNo keys starting with "git_" found in ~/.ssh/'));
    return;
  }

  const existingProfiles = manager.getProfiles();
  const existingKeys = new Set(existingProfiles.map(p => p.sshKey));

  const newKeys = gitKeys.map(k => path.join(sshDir, k)).filter(k => !existingKeys.has(k));

  if (newKeys.length === 0) {
    console.log(chalk.green('\nAll "git_" keys are already linked to profiles.'));
    return;
  }

  console.log(chalk.bold.cyan(`\n🔍 Found ${newKeys.length} unlinked keys starting with "git_":`));

  for (const keyPath of newKeys) {
    const keyName = path.basename(keyPath);
    const { shouldImport } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldImport',
        message: `Import key '${keyName}'?`,
        default: true
      }
    ]);

    if (shouldImport) {
      const basicInfo = await inquirer.prompt([
        { type: 'input', name: 'id', message: `Profile ID for ${keyName}:`, default: keyName.replace('git_id_ed25519_', '').replace('git_', ''), filter: val => val.trim() },
        { type: 'input', name: 'name', message: 'Git user.name:', validate: input => !!input, filter: val => val.trim() },
        { type: 'input', name: 'email', message: 'Git user.email:', validate: input => !!input, filter: val => val.trim() }
      ]);

      const { shouldSign } = await inquirer.prompt([
        { type: 'confirm', name: 'shouldSign', message: 'Enable commit signing for this profile?', default: true }
      ]);

      manager.saveProfile({
        ...basicInfo,
        sshKey: keyPath,
        signCommits: shouldSign
      });
      console.log(chalk.green(`Profile '${basicInfo.id}' imported!`));
    }
  }
}

async function deleteProfile(manager: ProfileManager) {
  const profiles = manager.getProfiles();
  if (profiles.length === 0) {
    console.log(chalk.yellow('\nNo profiles found.'));
    return;
  }

  const { profileId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profileId',
      message: 'Select profile to delete:',
      choices: profiles.map(p => ({ name: p.id, value: p.id }))
    }
  ]);

  manager.deleteProfile(profileId);
  console.log(chalk.green(`\nProfile '${profileId}' deleted.`));
}
