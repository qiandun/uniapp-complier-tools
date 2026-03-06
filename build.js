const { execSync } = require('child_process');

// 检查是否安装了vsce
try {
  execSync('vsce --version', { stdio: 'pipe' });
} catch (error) {
  console.log('正在安装 vsce...');
  execSync('npm install -g vsce', { stdio: 'inherit' });
}

// 构建VSIX包
console.log('构建VSIX包...');
execSync('vsce package', { stdio: 'inherit' });

console.log('构建完成！');