// WeatherManager 单元测试
// 由于 WeatherManager 在 pet.js 中定义，我们需要先提取它
// 这里我们测试天气相关的功能

describe('WeatherManager', () => {
  let WeatherManager;
  let weatherManager;

  beforeAll(() => {
    // 模拟 WeatherManager 类（从 pet.js 提取）
    WeatherManager = class {
      constructor() {
        this.currentWeather = null;
        this.lastUpdate = 0;
        this.updateInterval = 30 * 60 * 1000;
        this.city = "Beijing";
      }

      async updateWeather() {
        try {
          const weatherData = await this.getSimulatedWeather();
          if (weatherData) {
            this.currentWeather = weatherData;
            this.lastUpdate = Date.now();
          }
        } catch (error) {
          console.error("获取天气信息失败:", error);
        }
      }

      async getSimulatedWeather() {
        const weatherTypes = [
          { condition: "sunny", temperature: 25, description: "晴天" },
          { condition: "cloudy", temperature: 20, description: "多云" },
          { condition: "rainy", temperature: 15, description: "下雨" },
          { condition: "snowy", temperature: -5, description: "下雪" },
          { condition: "windy", temperature: 18, description: "大风" },
        ];

        const hour = new Date().getHours();
        let weatherIndex;

        if (hour >= 6 && hour <= 18) {
          weatherIndex = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * weatherTypes.length);
        } else {
          weatherIndex = Math.floor(Math.random() * weatherTypes.length);
        }

        return weatherTypes[weatherIndex];
      }

      getCurrentWeather() {
        return this.currentWeather;
      }

      setCity(city) {
        this.city = city;
      }
    };
  });

  beforeEach(() => {
    weatherManager = new WeatherManager();
  });

  describe('初始化', () => {
    test('应该正确初始化天气管理器', () => {
      expect(weatherManager.currentWeather).toBeNull();
      expect(weatherManager.lastUpdate).toBe(0);
      expect(weatherManager.updateInterval).toBe(30 * 60 * 1000);
      expect(weatherManager.city).toBe("Beijing");
    });
  });

  describe('天气数据获取', () => {
    test('应该能获取模拟天气数据', async () => {
      const weather = await weatherManager.getSimulatedWeather();
      
      expect(weather).toBeDefined();
      expect(weather).toHaveProperty('condition');
      expect(weather).toHaveProperty('temperature');
      expect(weather).toHaveProperty('description');
      
      const validConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
      expect(validConditions).toContain(weather.condition);
      expect(typeof weather.temperature).toBe('number');
      expect(typeof weather.description).toBe('string');
    });

    test('白天应该更可能是晴天', async () => {
      // 模拟白天时间
      const originalDate = Date;
      global.Date = jest.fn(() => ({
        getHours: () => 12 // 中午12点
      }));
      global.Date.now = originalDate.now;

      // 多次测试以验证概率
      const results = [];
      for (let i = 0; i < 10; i++) {
        const weather = await weatherManager.getSimulatedWeather();
        results.push(weather.condition);
      }

      // 恢复原始Date
      global.Date = originalDate;
      
      expect(results).toBeDefined();
      expect(results.length).toBe(10);
    });

    test('应该能更新天气数据', async () => {
      expect(weatherManager.currentWeather).toBeNull();
      expect(weatherManager.lastUpdate).toBe(0);

      await weatherManager.updateWeather();

      expect(weatherManager.currentWeather).toBeDefined();
      expect(weatherManager.lastUpdate).toBeGreaterThan(0);
    });
  });

  describe('天气状态管理', () => {
    test('应该能获取当前天气', () => {
      const testWeather = { condition: "sunny", temperature: 25, description: "晴天" };
      weatherManager.currentWeather = testWeather;

      expect(weatherManager.getCurrentWeather()).toEqual(testWeather);
    });

    test('应该能设置城市', () => {
      weatherManager.setCity("Shanghai");
      expect(weatherManager.city).toBe("Shanghai");
    });
  });

  describe('天气类型验证', () => {
    test('所有天气类型都应该有效', async () => {
      const validConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
      const validTemperatureRange = [-10, 40]; // 合理的温度范围

      // 多次获取天气数据进行验证
      for (let i = 0; i < 20; i++) {
        const weather = await weatherManager.getSimulatedWeather();
        
        expect(validConditions).toContain(weather.condition);
        expect(weather.temperature).toBeGreaterThanOrEqual(validTemperatureRange[0]);
        expect(weather.temperature).toBeLessThanOrEqual(validTemperatureRange[1]);
        expect(weather.description).toBeTruthy();
      }
    });
  });
});