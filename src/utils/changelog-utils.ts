import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function updateChangelog(version: string, commitMessage: string, commitHash: string) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const date = new Date().toISOString().split('T')[0];
  const hash = commitHash.substring(0, 7);
  const firstLine = commitMessage.split('\n')[0];

  let type: 'Features' | 'Improvements' | 'Bug Fixes' | 'Breaking Changes' | 'Other Changes' = 'Other Changes';
  
  if (commitMessage.includes('BREAKING CHANGE:') || commitMessage.match(/^[a-z]+(\([a-z-]+\))?!:/)) {
    type = 'Breaking Changes';
  } else if (commitMessage.startsWith('feat') || commitMessage.startsWith('✨ feat')) {
    type = 'Features';
  } else if (commitMessage.startsWith('improvement') || commitMessage.startsWith('🚀 improvement')) {
    type = 'Improvements';
  } else if (commitMessage.startsWith('fix') || commitMessage.startsWith('🐛 fix')) {
    type = 'Bug Fixes';
  }

  const entry = `- ${firstLine} (${hash})`;
  
  let content = '';
  if (fs.existsSync(changelogPath)) {
    content = fs.readFileSync(changelogPath, 'utf8');
  } else {
    content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }

  const versionSectionRegex = new RegExp(`## \\[${version}\\] - \\d{4}-\\d{2}-\\d{2}`, 'i');
  
  if (versionSectionRegex.test(content)) {
    // Version section exists, find the right subsection
    const sectionStart = content.search(versionSectionRegex);
    const nextVersionStart = content.slice(sectionStart + 1).search(/## \[/);
    const sectionEnd = nextVersionStart === -1 ? content.length : sectionStart + 1 + nextVersionStart;
    const section = content.slice(sectionStart, sectionEnd);

    const subSectionRegex = new RegExp(`### (✨ |🚀 |🐛 |💥 |🔧 )?${type}`, 'i');
    const icons: any = { 'Features': '✨ ', 'Improvements': '🚀 ', 'Bug Fixes': '🐛 ', 'Breaking Changes': '💥 ', 'Other Changes': '🔧 ' };
    const icon = icons[type] || '';

    if (subSectionRegex.test(section)) {
      // Subsection exists, append entry
      const subSectionMatch = section.match(subSectionRegex)!;
      const subSectionStart = section.indexOf(subSectionMatch[0]);
      const nextSubSectionMatch = section.slice(subSectionStart + 1).match(/### /);
      const subSectionEnd = nextSubSectionMatch ? subSectionStart + 1 + nextSubSectionMatch.index! : section.length;
      
      const newSection = section.slice(0, subSectionEnd).trim() + `\n${entry}\n\n` + section.slice(subSectionEnd).trim();
      content = content.slice(0, sectionStart) + newSection + content.slice(sectionEnd);
    } else {
      // Subsection doesn't exist, create it
      const newSection = section.trim() + `\n\n### ${icon}${type}\n${entry}\n\n`;
      content = content.slice(0, sectionStart) + newSection + content.slice(sectionEnd);
    }
  } else {
    // Version section doesn't exist, create it at the top
    const icon = type === 'Features' ? '✨ ' : type === 'Improvements' ? '🚀 ' : type === 'Bug Fixes' ? '🐛 ' : type === 'Breaking Changes' ? '💥 ' : '🔧 ';
    const header = `## [${version}] - ${date}\n\n### ${icon}${type}\n${entry}\n\n`;
    const changelogHeader = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    
    if (content.startsWith(changelogHeader)) {
      content = content.replace(changelogHeader, `${changelogHeader}${header}`);
    } else {
      content = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n${header}${content}`;
    }
  }

  fs.writeFileSync(changelogPath, content.trim() + '\n');
  return true;
}
