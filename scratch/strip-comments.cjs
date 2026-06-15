const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function stripComments(content) {
  // Simple replacement:
  // Strip // ... except if preceded by : (e.g. http://)
  // Strip /* ... */ 
  let newContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
  newContent = newContent.replace(/(?<!:)\/\/.*$/gm, '');
  return newContent;
}

walkDir(path.join(__dirname, '../src'), (filePath) => {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = stripComments(content);
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Stripped comments from: ' + filePath);
    }
  }
});
