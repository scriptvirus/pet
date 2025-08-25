# 桌面宠物打包指南

## 🎯 打包状态

### ✅ 已成功打包
- **macOS**: 已成功生成 `dist/mac/桌面宠物.app`
- **测试通过**: 所有功能模块测试通过

### ⚠️ Windows 打包问题
由于网络连接问题，无法下载 Windows 代码签名工具，导致 Windows 打包失败。

## 📦 当前可用的包

### macOS 应用包
- **位置**: `dist/mac/桌面宠物.app`
- **格式**: macOS 应用程序包
- **架构**: x64
- **状态**: ✅ 可直接运行

## 🛠️ Windows 打包解决方案

### 方案一：在 Windows 环境下打包
```bash
# 在 Windows 系统上运行
npm install
npm run build:win
```

### 方案二：使用 GitHub Actions 自动打包
创建 `.github/workflows/build.yml`：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build for Windows
      if: matrix.os == 'windows-latest'
      run: npm run build:win
      
    - name: Build for macOS
      if: matrix.os == 'macos-latest'
      run: npm run build:mac
      
    - name: Build for Linux
      if: matrix.os == 'ubuntu-latest'
      run: npm run build:linux
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.os }}-build
        path: dist/
```

### 方案三：本地 Windows 虚拟机
1. 使用 VirtualBox 或 VMware 创建 Windows 虚拟机
2. 在虚拟机中安装 Node.js 和项目依赖
3. 运行打包命令

### 方案四：云端构建服务
- **AppVeyor**: 专门支持 Windows 构建
- **Azure DevOps**: 微软官方 CI/CD 服务
- **CircleCI**: 支持多平台构建

## 🔧 打包配置说明

### 当前配置特点
```json
{
  "build": {
    "appId": "com.yourname.desktop-pet",
    "productName": "桌面宠物",
    "win": {
      "target": "portable",
      "sign": false,
      "verifyUpdateCodeSignature": false
    },
    "mac": {
      "target": "dmg"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### 配置优化建议
1. **图标**: 添加真实的应用图标
2. **签名**: 在生产环境中启用代码签名
3. **更新**: 配置自动更新机制

## 📋 打包前检查清单

### ✅ 已完成
- [x] 项目结构完整
- [x] 依赖安装正确
- [x] 测试全部通过
- [x] macOS 打包成功

### 🔄 待完成
- [ ] Windows 环境打包
- [ ] 应用图标制作
- [ ] 代码签名证书
- [ ] 自动更新配置

## 🚀 快速打包命令

### 本地打包
```bash
# 检查打包环境
npm run build-check

# 打包所有平台（需要对应环境）
npm run build

# 打包特定平台
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# 仅生成应用目录（不打包）
npm run pack
```

### 测试应用
```bash
# 开发模式运行
npm run dev

# 生产模式运行
npm start

# 运行测试
npm test
```

## 📊 打包结果

### 文件大小预估
- **macOS**: ~150MB (包含 Electron 运行时)
- **Windows**: ~120MB (便携版)
- **Linux**: ~130MB (AppImage)

### 支持的系统版本
- **Windows**: Windows 7 及以上
- **macOS**: macOS 10.11 及以上
- **Linux**: 主流发行版

## 🔍 故障排除

### 常见问题

1. **网络连接超时**
   ```bash
   # 使用国内镜像
   npm config set registry https://registry.npmmirror.com/
   npm config set electron_mirror https://npmmirror.com/mirrors/electron/
   ```

2. **权限问题**
   ```bash
   # macOS/Linux
   sudo npm install -g electron-builder
   
   # Windows (以管理员身份运行)
   npm install -g electron-builder
   ```

3. **依赖冲突**
   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

### 调试模式
```bash
# 启用详细日志
DEBUG=electron-builder npm run build:win

# 跳过代码签名
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:win
```

## 📝 下一步计划

### 短期目标
1. 解决 Windows 打包问题
2. 制作应用图标
3. 优化打包配置

### 长期目标
1. 设置 CI/CD 自动构建
2. 配置自动更新
3. 应用商店发布

## 💡 建议

1. **开发环境**: 建议在目标平台上进行打包
2. **网络环境**: 确保网络连接稳定，可访问 GitHub
3. **系统要求**: 使用较新版本的 Node.js (16+)
4. **存储空间**: 确保有足够的磁盘空间 (至少 2GB)

---

**注意**: 当前已成功生成 macOS 版本，可以在 macOS 系统上直接运行测试。Windows 版本需要在 Windows 环境或使用 CI/CD 服务进行构建。