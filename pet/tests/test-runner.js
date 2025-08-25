#!/usr/bin/env node

// 测试运行器 - 提供更好的测试体验
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testDir = path.join(__dirname);
    this.rootDir = path.join(__dirname, '..');
  }

  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始运行所有测试...\n');
    
    try {
      const result = execSync('npm test', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
      console.log('\n✅ 所有测试通过！');
      return true;
    } catch (error) {
      console.log('\n❌ 测试失败！');
      return false;
    }
  }

  // 运行特定测试文件
  runSpecificTest(testFile) {
    console.log(`🎯 运行测试文件: ${testFile}\n`);
    
    try {
      const result = execSync(`npx jest ${testFile}`, { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
      console.log(`\n✅ ${testFile} 测试通过！`);
      return true;
    } catch (error) {
      console.log(`\n❌ ${testFile} 测试失败！`);
      return false;
    }
  }

  // 运行覆盖率测试
  runCoverageTest() {
    console.log('📊 运行覆盖率测试...\n');
    
    try {
      const result = execSync('npm run test:coverage', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
      console.log('\n✅ 覆盖率测试完成！');
      return true;
    } catch (error) {
      console.log('\n❌ 覆盖率测试失败！');
      return false;
    }
  }

  // 监听模式
  runWatchMode() {
    console.log('👀 启动监听模式...\n');
    
    try {
      const result = execSync('npm run test:watch', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
    } catch (error) {
      console.log('\n❌ 监听模式异常退出！');
      return false;
    }
  }

  // 列出所有测试文件
  listTestFiles() {
    console.log('📋 可用的测试文件:\n');
    
    const testFiles = fs.readdirSync(this.testDir)
      .filter(file => file.endsWith('.test.js'))
      .sort();
    
    testFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    return testFiles;
  }

  // 生成测试报告
  generateReport() {
    console.log('📈 生成测试报告...\n');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      testFiles: this.listTestFiles(),
      coverage: null
    };

    // 运行覆盖率测试并获取结果
    try {
      execSync('npm run test:coverage -- --silent', { 
        cwd: this.rootDir 
      });
      
      // 检查覆盖率文件是否存在
      const coveragePath = path.join(this.rootDir, 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        reportData.coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      }
    } catch (error) {
      console.log('⚠️  无法获取覆盖率数据');
    }

    // 保存报告
    const reportPath = path.join(this.rootDir, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`✅ 测试报告已生成: ${reportPath}`);
    return reportData;
  }

  // 显示帮助信息
  showHelp() {
    console.log(`
🧪 桌面宠物测试运行器

用法:
  node test-runner.js [命令] [选项]

命令:
  all           运行所有测试
  coverage      运行覆盖率测试
  watch         启动监听模式
  list          列出所有测试文件
  report        生成测试报告
  help          显示此帮助信息
  
  <文件名>      运行特定测试文件

示例:
  node test-runner.js all
  node test-runner.js audio.test.js
  node test-runner.js coverage
  node test-runner.js watch
    `);
  }
}

// 主程序
function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'all':
      runner.runAllTests();
      break;
    
    case 'coverage':
      runner.runCoverageTest();
      break;
    
    case 'watch':
      runner.runWatchMode();
      break;
    
    case 'list':
      runner.listTestFiles();
      break;
    
    case 'report':
      runner.generateReport();
      break;
    
    case 'help':
      runner.showHelp();
      break;
    
    default:
      // 尝试作为测试文件名运行
      if (command.endsWith('.test.js')) {
        runner.runSpecificTest(command);
      } else {
        console.log(`❌ 未知命令: ${command}`);
        runner.showHelp();
      }
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;