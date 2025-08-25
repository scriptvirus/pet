#!/usr/bin/env node

// 发布脚本 - 自动化打包和发布流程
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReleaseManager {
  constructor() {
    this.version = this.getVersion();
    this.platform = process.platform;
  }

  getVersion() {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pkg.version;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    console.log(`${icons[type]} [${timestamp}] ${message}`);
  }

  async checkEnvironment() {
    this.log('检查构建环境...');
    
    try {
      // 检查 Node.js 版本
      const nodeVersion = process.version;
      this.log(`Node.js 版本: ${nodeVersion}`);
      
      // 检查 npm 版本
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`npm 版本: ${npmVersion}`);
      
      // 检查平台
      this.log(`当前平台: ${this.platform}`);
      
      // 检查依赖
      if (!fs.existsSync('node_modules')) {
        this.log('依赖未安装，正在安装...', 'warning');
        execSync('npm install', { stdio: 'inherit' });
      }
      
      this.log('环境检查完成', 'success');
      return true;
    } catch (error) {
      this.log(`环境检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  async runTests() {
    this.log('运行测试...');
    
    try {
      execSync('npm test', { stdio: 'inherit' });
      this.log('所有测试通过', 'success');
      return true;
    } catch (error) {
      this.log('测试失败，请修复后重试', 'error');
      return false;
    }
  }

  async buildForCurrentPlatform() {
    this.log(`为 ${this.platform} 平台构建...`);
    
    try {
      let buildCommand;
      switch (this.platform) {
        case 'win32':
          buildCommand = 'npm run build:win';
          break;
        case 'darwin':
          buildCommand = 'npm run build:mac';
          break;
        case 'linux':
          buildCommand = 'npm run build:linux';
          break;
        default:
          throw new Error(`不支持的平台: ${this.platform}`);
      }
      
      execSync(buildCommand, { stdio: 'inherit' });
      this.log('构建完成', 'success');
      return true;
    } catch (error) {
      this.log(`构建失败: ${error.message}`, 'error');
      return false;
    }
  }

  async buildAll() {
    this.log('构建所有平台...');
    
    const platforms = ['win', 'mac', 'linux'];
    const results = {};
    
    for (const platform of platforms) {
      try {
        this.log(`构建 ${platform} 平台...`);
        execSync(`npm run build:${platform}`, { stdio: 'inherit' });
        results[platform] = 'success';
        this.log(`${platform} 构建成功`, 'success');
      } catch (error) {
        results[platform] = 'failed';
        this.log(`${platform} 构建失败: ${error.message}`, 'error');
      }
    }
    
    return results;
  }

  generateReleaseNotes() {
    const notes = `
# 桌面宠物 v${this.version} 发布说明

## 🎉 新功能
- 可爱的桌面宠物陪伴
- 多种宠物类型选择（猫、狗、兔子、羊、猫头鹰）
- 智能提醒系统（喝水、休息、运动）
- 天气同步功能
- 丰富的互动动画

## 🛠️ 技术特性
- 基于 Electron 开发
- 跨平台支持 (Windows, macOS, Linux)
- 完整的单元测试覆盖
- 现代化的用户界面

## 📦 安装包信息
- **Windows**: 便携版，无需安装
- **macOS**: .app 应用包
- **Linux**: AppImage 格式

## 🔧 系统要求
- **Windows**: Windows 7 及以上
- **macOS**: macOS 10.11 及以上
- **Linux**: 主流发行版

## 📝 使用说明
1. 下载对应平台的安装包
2. 解压或安装到本地
3. 运行应用程序
4. 享受可爱的桌面宠物！

---
构建时间: ${new Date().toLocaleString()}
构建平台: ${this.platform}
    `.trim();
    
    fs.writeFileSync('RELEASE_NOTES.md', notes);
    this.log('发布说明已生成: RELEASE_NOTES.md', 'success');
  }

  listBuildArtifacts() {
    this.log('构建产物列表:');
    
    if (!fs.existsSync('dist')) {
      this.log('没有找到构建产物', 'warning');
      return;
    }
    
    const distFiles = fs.readdirSync('dist', { withFileTypes: true });
    
    distFiles.forEach(file => {
      if (file.isDirectory()) {
        const dirPath = path.join('dist', file.name);
        const dirSize = this.getDirSize(dirPath);
        this.log(`📁 ${file.name}/ (${this.formatSize(dirSize)})`);
        
        // 列出目录内容
        const subFiles = fs.readdirSync(dirPath);
        subFiles.forEach(subFile => {
          const subPath = path.join(dirPath, subFile);
          const stats = fs.statSync(subPath);
          if (stats.isFile()) {
            this.log(`   📄 ${subFile} (${this.formatSize(stats.size)})`);
          } else {
            this.log(`   📁 ${subFile}/`);
          }
        });
      } else {
        const filePath = path.join('dist', file.name);
        const stats = fs.statSync(filePath);
        this.log(`📄 ${file.name} (${this.formatSize(stats.size)})`);
      }
    });
  }

  getDirSize(dirPath) {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  async release(options = {}) {
    this.log(`🚀 开始发布流程 v${this.version}`);
    
    // 检查环境
    if (!(await this.checkEnvironment())) {
      return false;
    }
    
    // 运行测试
    if (options.skipTests !== true) {
      if (!(await this.runTests())) {
        return false;
      }
    }
    
    // 构建
    let buildSuccess = false;
    if (options.buildAll) {
      const results = await this.buildAll();
      buildSuccess = Object.values(results).some(result => result === 'success');
    } else {
      buildSuccess = await this.buildForCurrentPlatform();
    }
    
    if (!buildSuccess) {
      this.log('构建失败，发布中止', 'error');
      return false;
    }
    
    // 生成发布说明
    this.generateReleaseNotes();
    
    // 列出构建产物
    this.listBuildArtifacts();
    
    this.log('🎉 发布流程完成！', 'success');
    this.log('📦 构建产物位于 dist/ 目录');
    this.log('📝 发布说明: RELEASE_NOTES.md');
    
    return true;
  }
}

// 命令行接口
function main() {
  const args = process.argv.slice(2);
  const releaseManager = new ReleaseManager();
  
  const options = {
    skipTests: args.includes('--skip-tests'),
    buildAll: args.includes('--all-platforms')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 桌面宠物发布工具

用法:
  node scripts/release.js [选项]

选项:
  --skip-tests      跳过测试
  --all-platforms   构建所有平台
  --help, -h        显示帮助信息

示例:
  node scripts/release.js                    # 标准发布流程
  node scripts/release.js --skip-tests       # 跳过测试
  node scripts/release.js --all-platforms    # 构建所有平台
    `);
    return;
  }
  
  releaseManager.release(options).catch(error => {
    console.error('发布失败:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = ReleaseManager;