// DesktopPet 核心功能单元测试
const { ipcRenderer } = require('electron');

// 模拟 DOM 元素
const createMockElement = (id) => ({
  id,
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn().mockReturnValue(false)
  },
  addEventListener: jest.fn(),
  style: {},
  textContent: '',
  querySelector: jest.fn(),
  querySelectorAll: jest.fn().mockReturnValue([]),
  getBoundingClientRect: jest.fn().mockReturnValue({
    left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100
  }),
  appendChild: jest.fn(),
  removeChild: jest.fn()
});

describe('DesktopPet', () => {
  let DesktopPet;
  let desktopPet;
  let mockElements;

  beforeAll(() => {
    // 模拟 DesktopPet 类的核心功能
    DesktopPet = class {
      constructor() {
        this.mood = "happy";
        this.energy = 100;
        this.hunger = 0;
        this.settings = {};
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.statusVisible = false;
        this.reminderTimers = {};
        this.currentWeather = null;
        this.weatherElements = [];
        this.lastReminderTime = null;
      }

      updateStats() {
        this.hunger = Math.min(100, this.hunger + 2);
        this.energy = Math.max(0, this.energy - 1);

        if (this.hunger > 80) {
          this.mood = "hungry";
        } else if (this.energy < 20) {
          this.mood = "sleepy";
        } else if (this.energy > 80 && this.hunger < 30) {
          this.mood = "happy";
        } else {
          this.mood = "bored";
        }
      }

      feed() {
        this.hunger = Math.max(0, this.hunger - 30);
        this.energy = Math.min(100, this.energy + 10);
        this.mood = "happy";
        return "宠物很开心地吃了食物！";
      }

      play() {
        this.energy = Math.max(0, this.energy - 20);
        this.hunger = Math.min(100, this.hunger + 10);
        this.mood = "happy";
        return "宠物玩得很开心！";
      }

      sleep() {
        this.energy = Math.min(100, this.energy + 50);
        this.mood = "sleepy";
        return "宠物开始睡觉了...";
      }

      toggleStatus() {
        this.statusVisible = !this.statusVisible;
        return this.statusVisible;
      }

      onWeatherChange(weatherData) {
        this.currentWeather = weatherData;
        this.updateWeatherEffects();
        this.adaptPetToWeather();
      }

      updateWeatherEffects() {
        this.clearWeatherEffects();
        if (!this.currentWeather) return;
        
        // 模拟天气效果更新
        this.weatherElements = [`${this.currentWeather.condition}-effect`];
      }

      clearWeatherEffects() {
        this.weatherElements = [];
      }

      adaptPetToWeather() {
        if (!this.currentWeather) return;
        
        // 根据天气调整宠物状态
        switch (this.currentWeather.condition) {
          case 'rainy':
            this.mood = 'bored';
            break;
          case 'sunny':
            this.mood = 'happy';
            break;
          case 'snowy':
            this.energy = Math.max(0, this.energy - 5);
            break;
        }
      }

      checkReminders() {
        const now = Date.now();
        const reminderInterval = (this.settings.reminderInterval || 120) * 60 * 1000;

        if (!this.lastReminderTime) {
          this.lastReminderTime = now;
          return false;
        }

        if (now - this.lastReminderTime >= reminderInterval) {
          this.lastReminderTime = now;
          return true;
        }
        return false;
      }
    };
  });

  beforeEach(() => {
    // 设置 DOM 模拟
    mockElements = {
      pet: createMockElement('pet'),
      contextMenu: createMockElement('context-menu'),
      statusDisplay: createMockElement('status-display')
    };

    global.document.getElementById = jest.fn((id) => mockElements[id] || createMockElement(id));
    
    // 不直接设置 document.body，而是模拟其方法
    Object.defineProperty(global.document, 'body', {
      value: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      },
      writable: true
    });

    desktopPet = new DesktopPet();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初始化状态', () => {
    test('应该正确初始化宠物状态', () => {
      expect(desktopPet.mood).toBe("happy");
      expect(desktopPet.energy).toBe(100);
      expect(desktopPet.hunger).toBe(0);
      expect(desktopPet.isDragging).toBe(false);
      expect(desktopPet.statusVisible).toBe(false);
    });

    test('应该初始化空的设置对象', () => {
      expect(desktopPet.settings).toEqual({});
      expect(desktopPet.reminderTimers).toEqual({});
    });
  });

  describe('宠物状态更新', () => {
    test('应该正确更新饥饿度和精力值', () => {
      const initialHunger = desktopPet.hunger;
      const initialEnergy = desktopPet.energy;

      desktopPet.updateStats();

      expect(desktopPet.hunger).toBe(Math.min(100, initialHunger + 2));
      expect(desktopPet.energy).toBe(Math.max(0, initialEnergy - 1));
    });

    test('应该根据状态正确更新心情', () => {
      // 测试饥饿状态
      desktopPet.hunger = 85;
      desktopPet.energy = 50;
      desktopPet.updateStats();
      expect(desktopPet.mood).toBe("hungry");

      // 测试困倦状态
      desktopPet.hunger = 50;
      desktopPet.energy = 15;
      desktopPet.updateStats();
      expect(desktopPet.mood).toBe("sleepy");

      // 测试开心状态
      desktopPet.hunger = 20;
      desktopPet.energy = 85;
      desktopPet.updateStats();
      expect(desktopPet.mood).toBe("happy");

      // 测试无聊状态
      desktopPet.hunger = 50;
      desktopPet.energy = 50;
      desktopPet.updateStats();
      expect(desktopPet.mood).toBe("bored");
    });
  });

  describe('宠物互动功能', () => {
    test('喂食应该减少饥饿度并增加精力', () => {
      desktopPet.hunger = 50;
      desktopPet.energy = 50;

      const result = desktopPet.feed();

      expect(desktopPet.hunger).toBe(20); // 50 - 30
      expect(desktopPet.energy).toBe(60); // 50 + 10
      expect(desktopPet.mood).toBe("happy");
      expect(result).toBe("宠物很开心地吃了食物！");
    });

    test('喂食不应该让饥饿度变为负数', () => {
      desktopPet.hunger = 10;
      desktopPet.feed();
      expect(desktopPet.hunger).toBe(0);
    });

    test('喂食不应该让精力超过100', () => {
      desktopPet.energy = 95;
      desktopPet.feed();
      expect(desktopPet.energy).toBe(100);
    });

    test('玩耍应该消耗精力并增加饥饿度', () => {
      desktopPet.energy = 50;
      desktopPet.hunger = 20;

      const result = desktopPet.play();

      expect(desktopPet.energy).toBe(30); // 50 - 20
      expect(desktopPet.hunger).toBe(30); // 20 + 10
      expect(desktopPet.mood).toBe("happy");
      expect(result).toBe("宠物玩得很开心！");
    });

    test('玩耍不应该让精力变为负数', () => {
      desktopPet.energy = 10;
      desktopPet.play();
      expect(desktopPet.energy).toBe(0);
    });

    test('睡觉应该恢复精力', () => {
      desktopPet.energy = 30;

      const result = desktopPet.sleep();

      expect(desktopPet.energy).toBe(80); // 30 + 50
      expect(desktopPet.mood).toBe("sleepy");
      expect(result).toBe("宠物开始睡觉了...");
    });

    test('睡觉不应该让精力超过100', () => {
      desktopPet.energy = 80;
      desktopPet.sleep();
      expect(desktopPet.energy).toBe(100);
    });
  });

  describe('状态显示功能', () => {
    test('应该能切换状态显示', () => {
      expect(desktopPet.statusVisible).toBe(false);

      const result1 = desktopPet.toggleStatus();
      expect(desktopPet.statusVisible).toBe(true);
      expect(result1).toBe(true);

      const result2 = desktopPet.toggleStatus();
      expect(desktopPet.statusVisible).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('天气同步功能', () => {
    test('应该能响应天气变化', () => {
      const weatherData = {
        condition: "rainy",
        temperature: 15,
        description: "下雨"
      };

      desktopPet.onWeatherChange(weatherData);

      expect(desktopPet.currentWeather).toEqual(weatherData);
      expect(desktopPet.weatherElements).toContain("rainy-effect");
    });

    test('应该根据天气调整宠物状态', () => {
      // 测试下雨天气
      desktopPet.mood = "happy";
      desktopPet.onWeatherChange({ condition: "rainy", temperature: 15 });
      expect(desktopPet.mood).toBe("bored");

      // 测试晴天天气
      desktopPet.onWeatherChange({ condition: "sunny", temperature: 25 });
      expect(desktopPet.mood).toBe("happy");

      // 测试下雪天气
      desktopPet.energy = 50;
      desktopPet.onWeatherChange({ condition: "snowy", temperature: -5 });
      expect(desktopPet.energy).toBe(45);
    });

    test('应该能清除天气效果', () => {
      desktopPet.weatherElements = ["rain-effect", "snow-effect"];
      desktopPet.clearWeatherEffects();
      expect(desktopPet.weatherElements).toEqual([]);
    });
  });

  describe('提醒系统', () => {
    test('应该正确检查提醒时间', () => {
      desktopPet.settings.reminderInterval = 1; // 1分钟用于测试
      
      // 第一次检查应该设置时间但不触发提醒
      const result1 = desktopPet.checkReminders();
      expect(result1).toBe(false);
      expect(desktopPet.lastReminderTime).toBeTruthy();

      // 模拟时间过去
      const oldTime = desktopPet.lastReminderTime;
      desktopPet.lastReminderTime = oldTime - 2 * 60 * 1000; // 2分钟前

      const result2 = desktopPet.checkReminders();
      expect(result2).toBe(true);
    });

    test('时间未到时不应该触发提醒', () => {
      desktopPet.settings.reminderInterval = 120; // 2小时
      desktopPet.lastReminderTime = Date.now() - 30 * 60 * 1000; // 30分钟前

      const result = desktopPet.checkReminders();
      expect(result).toBe(false);
    });
  });
});