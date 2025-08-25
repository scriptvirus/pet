# 桌面宠物单元测试

这个目录包含了桌面宠物应用的完整测试套件。

## 测试结构

```
tests/
├── __mocks__/           # 模拟对象
│   └── electron.js      # Electron API 模拟
├── setup.js             # Jest 测试环境设置
├── audio.test.js        # 音频管理器测试
├── weather.test.js      # 天气管理器测试
├── pet.test.js          # 宠物核心功能测试
├── integration.test.js  # 集成测试
├── performance.test.js  # 性能测试
├── test-runner.js       # 测试运行器
└── README.md           # 本文件
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# 使用 npm
npm test -- audio.test.js

# 使用测试运行器
node tests/test-runner.js audio.test.js
```

### 监听模式

```bash
npm run test:watch
```

### 覆盖率测试

```bash
npm run test:coverage
```

## 测试运行器

我们提供了一个自定义的测试运行器，提供更好的测试体验：

```bash
# 显示帮助
node tests/test-runner.js help

# 运行所有测试
node tests/test-runner.js all

# 运行覆盖率测试
node tests/test-runner.js coverage

# 启动监听模式
node tests/test-runner.js watch

# 列出所有测试文件
node tests/test-runner.js list

# 生成测试报告
node tests/test-runner.js report
```

## 测试类型

### 1. 单元测试

- **audio.test.js**: 测试音频管理器的所有功能
- **weather.test.js**: 测试天气管理器的功能
- **pet.test.js**: 测试宠物核心逻辑

### 2. 集成测试

- **integration.test.js**: 测试各模块间的协作

### 3. 性能测试

- **performance.test.js**: 测试应用性能和内存使用

## 测试覆盖的功能

### 音频系统
- ✅ 音效播放
- ✅ 音量控制
- ✅ 静音功能
- ✅ 音效参数验证

### 天气系统
- ✅ 天气数据获取
- ✅ 天气状态管理
- ✅ 模拟天气生成
- ✅ 城市设置

### 宠物系统
- ✅ 宠物状态管理（饥饿度、精力、心情）
- ✅ 互动功能（喂食、玩耍、睡觉）
- ✅ 状态显示切换
- ✅ 天气响应
- ✅ 提醒系统

### 集成功能
- ✅ 音效与互动的集成
- ✅ 天气与宠物状态的集成
- ✅ 提醒系统集成
- ✅ 设置系统集成
- ✅ IPC 通信
- ✅ 错误处理

### 性能测试
- ✅ 状态更新性能
- ✅ 音效系统性能
- ✅ 内存使用测试
- ✅ 定时器性能
- ✅ DOM 操作性能
- ✅ 算法复杂度测试

## 模拟对象

### Electron API 模拟
- `ipcRenderer`: 模拟进程间通信
- `app`: 模拟应用生命周期
- `BrowserWindow`: 模拟窗口管理
- `screen`: 模拟屏幕信息

### Web API 模拟
- `AudioContext`: 模拟 Web Audio API
- DOM 方法和属性
- 定时器函数

## 测试配置

Jest 配置在 `package.json` 中：

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "testMatch": ["<rootDir>/tests/**/*.test.js"],
    "collectCoverageFrom": ["src/**/*.js", "!src/main.js"],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
```

## 最佳实践

### 编写测试
1. 每个测试应该独立且可重复
2. 使用描述性的测试名称
3. 遵循 AAA 模式（Arrange, Act, Assert）
4. 适当使用模拟对象

### 测试组织
1. 按功能模块组织测试文件
2. 使用 `describe` 块组织相关测试
3. 在 `beforeEach` 中设置测试环境
4. 在 `afterEach` 中清理测试环境

### 覆盖率目标
- 行覆盖率: > 80%
- 函数覆盖率: > 90%
- 分支覆盖率: > 75%

## 持续集成

测试可以轻松集成到 CI/CD 流程中：

```bash
# 在 CI 环境中运行
npm test -- --ci --coverage --watchAll=false
```

## 故障排除

### 常见问题

1. **Electron 模拟问题**
   - 确保 `__mocks__/electron.js` 正确配置
   - 检查 Jest 配置中的 `moduleNameMapping`

2. **DOM 相关错误**
   - 确保使用 `jsdom` 测试环境
   - 检查 `setup.js` 中的 DOM 模拟

3. **异步测试问题**
   - 使用 `async/await` 或返回 Promise
   - 适当设置测试超时时间

### 调试测试

```bash
# 运行单个测试并显示详细输出
npm test -- --verbose audio.test.js

# 调试模式
node --inspect-brk node_modules/.bin/jest --runInBand audio.test.js
```

## 贡献指南

1. 为新功能编写测试
2. 确保所有测试通过
3. 维持覆盖率标准
4. 更新相关文档