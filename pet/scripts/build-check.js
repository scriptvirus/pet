#!/usr/bin/env node

// 打包前检查脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 开始打包前检查...\n');

// 检查必要的文件
const requiredFiles = [
  'src/main.js',
  'src/index.html',
  'src/pet.js',
  'src/audio.js',
  'src/settings.html',
  'src/reminder.html',
  'package.json'
];

// 检查可选的资源文件
const optionalFiles = [
  'assets/icon.ico',
  'assets/icon.png',
  'assets/icon.icns',
  'build/installer.nsh'
];

let allGood = true;

console.log('📁 检查必要文件:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - 缺失！`);
    allGood = false;
  }
});

console.log('\n🎨 检查资源文件:');
optionalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - 建议添加`);
  }
});

// 检查 package.json 配置
console.log('\n⚙️  检查 package.json 配置:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (pkg.main) {
    console.log(`  ✅ main: ${pkg.main}`);
  } else {
    console.log('  ❌ 缺少 main 字段');
    allGood = false;
  }
  
  if (pkg.build) {
    console.log('  ✅ build 配置存在');
  } else {
    console.log('  ❌ 缺少 build 配置');
    allGood = false;
  }
  
  if (pkg.build && pkg.build.win) {
    console.log('  ✅ Windows 打包配置存在');
  } else {
    console.log('  ⚠️  缺少 Windows 打包配置');
  }
  
} catch (error) {
  console.log('  ❌ package.json 解析失败');
  allGood = false;
}

// 检查依赖
console.log('\n📦 检查关键依赖:');
const requiredDeps = ['electron', 'electron-builder', 'electron-store'];
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`  ✅ ${dep}: ${allDeps[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - 缺失！`);
      allGood = false;
    }
  });
} catch (error) {
  console.log('  ❌ 依赖检查失败');
  allGood = false;
}

// 输出结果
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 检查通过！可以开始打包。');
  console.log('\n💡 打包命令:');
  console.log('  npm run build:win    # Windows 安装包');
  console.log('  npm run build        # 所有平台');
  process.exit(0);
} else {
  console.log('❌ 检查失败！请修复上述问题后再打包。');
  process.exit(1);
}