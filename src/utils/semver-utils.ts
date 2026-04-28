export function incrementVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }

  let [major, minor, patch] = parts;

  switch (type) {
    case 'major':
      major++;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor++;
      patch = 0;
      break;
    case 'patch':
      patch++;
      break;
  }

  return `${major}.${minor}.${patch}`;
}
