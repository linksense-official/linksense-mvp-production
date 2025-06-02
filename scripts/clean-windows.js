const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
      }
      console.log(`✅ Deleted: ${dirPath}`);
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to delete ${dirPath}:`, error.message);
  }
}

function cleanProject() {
  console.log('🧹 Starting project cleanup...');
  
  const projectRoot = process.cwd();
  
  // 削除対象のディレクトリ
  const dirsToDelete = [
    path.join(projectRoot, '.next'),
    path.join(projectRoot, 'node_modules', '.cache'),
    path.join(projectRoot, '.vercel'),
    path.join(projectRoot, 'dist'),
    path.join(projectRoot, 'build'),
  ];
  
  dirsToDelete.forEach(deleteDirectory);
  
  console.log('✨ Project cleanup completed!');
}

if (require.main === module) {
  cleanProject();
}

module.exports = { cleanProject, deleteDirectory };