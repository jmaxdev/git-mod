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
        { name: '📝 Edit profile', value: 'edit' },
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
    case 'edit':
      await editProfile(profileManager, engine);
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
  await applyProfile(profile, engine, scope as 'local' | 'global');
}

async function applyProfile(profile: Profile, engine: GitEngine, scope: 'local' | 'global') {
  const spinner = ora(`Applying profile ${scope}ly...`).start();

  try {
    await engine.setConfig('user.name', profile.name, scope);
    await engine.setConfig('user.email', profile.email, scope);
    if (profile.sshKey) {
      await engine.setSSHCommand(profile.sshKey, scope);
      
      if (profile.signCommits) {
        await engine.setConfig('gpg.format', 'ssh', scope);
        await engine.setConfig('user.signingkey', profile.sshKey, scope);
        await engine.setConfig('commit.gpgsign', 'true', scope);
      } else {
        await engine.setConfig('commit.gpgsign', 'false', scope);
      }
    }
    spinner.succeed(chalk.green(`Profile '${profile.id}' applied ${scope}ly.`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to apply profile: ${error.message}`));
  }
}

async function addProfile(manager: ProfileManager) {
  const basicInfo = await inquirer.prompt([
    { type: 'input', name: 'id', message: 'Profile ID (e.g., work, personal):', validate: input => !!input, filter: val => val.trim() },
    { type: 'input', name: 'name', message: 'Git user.name:', validate: input => !!input, filter: val => val.trim() },
    { type: 'input', name: 'email', message: 'Git user.email (use GitHub noreply for privacy):', validate: input => !!input, filter: val => val.trim() }
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
    sshKeyPath = await generateSSHKey(basicInfo.id, basicInfo.email);
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

async function generateSSHKey(id: string, email: string): Promise<string> {
  const sshDir = path.join(os.homedir(), '.ssh');
  const uniqueId = Math.random().toString(36).substring(2, 7);
  let defaultPath = path.join(sshDir, `git_id_${uniqueId}_${id}`);

  const { customPath } = await inquirer.prompt([
    { type: 'input', name: 'customPath', message: 'Save key to:', default: defaultPath, filter: val => val.trim() }
  ]);
  
  const sshKeyPath = customPath;

  // Handle existing files
  if (fs.existsSync(sshKeyPath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow(`File ${sshKeyPath} already exists. Overwrite?`),
        default: false
      }
    ]);
    if (!overwrite) return '';
    try {
      fs.unlinkSync(sshKeyPath);
      if (fs.existsSync(`${sshKeyPath}.pub`)) fs.unlinkSync(`${sshKeyPath}.pub`);
    } catch (e: any) {
      console.log(chalk.red(`Failed to remove existing file: ${e.message}`));
      return '';
    }
  }

  const spinner = ora('Generating Ed25519 SSH key...').start();
  
  try {
    const sshDir = path.dirname(sshKeyPath);
    if (!fs.existsSync(sshDir)) fs.mkdirSync(sshDir, { recursive: true });

    // Try to run ssh-keygen
    execSync(`ssh-keygen -t ed25519 -C "${email}" -f "${sshKeyPath}" -N ""`, { stdio: 'pipe' });
    spinner.succeed(chalk.green('SSH Key generated successfully!'));

    const pubKey = fs.readFileSync(`${sshKeyPath}.pub`, 'utf-8');
    console.log(chalk.bold.cyan('\n📋 COPY THIS PUBLIC KEY TO GITHUB:'));
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(pubKey.trim());
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(chalk.yellow('\n1. Add as "Authentication Key" to allow PUSH/PULL access.'));
    console.log(chalk.yellow('2. Add as "Signing Key" to get the "Verified" badge.'));
    console.log(chalk.dim('\nSettings > SSH and GPG keys > New SSH key\n'));
    return sshKeyPath;
  } catch (error: any) {
    spinner.fail(chalk.red('Failed to generate key.'));
    console.log(chalk.red(`Error: ${error.stderr?.toString() || error.message}`));
    
    if (error.message.includes('not recognized')) {
      console.log(chalk.yellow('\nTip: Make sure OpenSSH or Git is installed and "ssh-keygen" is in your PATH.'));
    }
    
    return '';
  }
}

async function editProfile(manager: ProfileManager, engine: GitEngine) {
  const profiles = manager.getProfiles();
  if (profiles.length === 0) {
    console.log(chalk.yellow('\nNo profiles found.'));
    return;
  }

  const { profileId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profileId',
      message: 'Select profile to edit:',
      choices: profiles.map(p => ({ name: `${p.id} (${p.name} <${p.email}>)`, value: p.id }))
    }
  ]);

  const profile = profiles.find(p => p.id === profileId)!;

  const updates = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Git user.name:', default: profile.name, validate: input => !!input, filter: val => val.trim() },
    { type: 'input', name: 'email', message: 'Git user.email (use GitHub noreply for privacy):', default: profile.email, validate: input => !!input, filter: val => val.trim() }
  ]);

  const { sshAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sshAction',
      message: 'SSH Key configuration:',
      choices: [
        { name: `🔒 Keep current (${profile.sshKey || 'None'})`, value: 'keep' },
        { name: '🆕 Generate a new SSH key', value: 'generate' },
        { name: '📂 Use an existing SSH key (manual path)', value: 'existing' },
        { name: '❌ Remove SSH key', value: 'remove' }
      ]
    }
  ]);

  let sshKey = profile.sshKey;
  const oldSshKey = profile.sshKey;

  if (sshAction === 'generate') {
    sshKey = await generateSSHKey(profile.id, updates.email);
    // Automatically delete old keys if a new one was successfully generated
    if (sshKey && oldSshKey && oldSshKey !== sshKey) {
      try {
        if (fs.existsSync(oldSshKey)) fs.unlinkSync(oldSshKey);
        if (fs.existsSync(`${oldSshKey}.pub`)) fs.unlinkSync(`${oldSshKey}.pub`);
        console.log(chalk.dim(`\n🗑️ Previous key files (${oldSshKey}) deleted.`));
      } catch (e: any) {
        console.log(chalk.red(`\n⚠️ Failed to delete old keys: ${e.message}`));
      }
    }
  } else if (sshAction === 'existing') {
    const { existingPath } = await inquirer.prompt([
      { type: 'input', name: 'existingPath', message: 'Path to Private Key:', default: profile.sshKey, filter: val => val.trim() }
    ]);
    sshKey = existingPath;

    // For manual replacement, we still ask before deleting
    if (oldSshKey && oldSshKey !== sshKey) {
      const { deleteOld } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'deleteOld',
          message: chalk.yellow(`Do you want to delete the old key files from disk? (${oldSshKey})`),
          default: false
        }
      ]);

      if (deleteOld) {
        try {
          if (fs.existsSync(oldSshKey)) fs.unlinkSync(oldSshKey);
          if (fs.existsSync(`${oldSshKey}.pub`)) fs.unlinkSync(`${oldSshKey}.pub`);
          console.log(chalk.dim('Old key files deleted.'));
        } catch (e: any) {
          console.log(chalk.red(`Failed to delete old keys: ${e.message}`));
        }
      }
    }
  } else if (sshAction === 'remove') {
    sshKey = undefined;
  }

  let signCommits = profile.signCommits;
  if (sshKey) {
    const { shouldSign } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldSign',
        message: 'Do you want to enable automatic commit signing with this SSH key?',
        default: profile.signCommits
      }
    ]);
    signCommits = shouldSign;
  } else {
    signCommits = false;
  }

  const updatedProfile = {
    ...profile,
    ...updates,
    sshKey,
    signCommits
  };

  manager.saveProfile(updatedProfile);

  console.log(chalk.green(`\n✅ Profile '${profileId}' updated in config.`));

  const { applyNow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'applyNow',
      message: 'Do you want to apply these changes now?',
      choices: [
        { name: '📂 Apply to CURRENT repository (Local)', value: 'local' },
        { name: '🌎 Apply EVERYWHERE (Global)', value: 'global' },
        { name: '⏭️ Don\'t apply now', value: 'skip' }
      ]
    }
  ]);

  if (applyNow !== 'skip') {
    await applyProfile(updatedProfile, engine, applyNow as 'local' | 'global');
  }
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
    console.log(chalk.yellow('\n1. Add as "Authentication Key" to allow PUSH/PULL access.'));
    console.log(chalk.yellow('2. Add as "Signing Key" to get the "Verified" badge.'));
    console.log(chalk.dim('\nSettings > SSH and GPG keys > New SSH key\n'));
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
