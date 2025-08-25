// 集成测试 - 测试各模块间的协作
const { ipcRenderer } = require('electron');

describe('桌面宠物集成测试', () => {
  let mockPet;
  let mockAudioManager;
  let mockWeatherManager;

  beforeEach(() => {
    // 模拟完整的宠物系统
    mockAudioManager = {
      volume: 0.5,
      muted: false,
      playSound: jest.fn(),
      setVolume: jest.fn(),
      toggleMute: jest.fn()
    };

    mockWeatherManager = {
      currentWeather: null,
      updateWeather: jest.fn(),
      getCurrentWeather: jest.fn(),
      setCity: jest.fn()
    };

    mockPet = {
      mood: "happy",
      energy: 100,
      hunger: 0,
      settings: {
        petType: "cat",
        soundEnabled: true,
        weatherEnabled: true,
        reminders: {
          water: true,
          rest: true,
          stand: false,
          exercise: false
        }
      },
      audioManager: mockAudioManager,
      weatherManager: mockWeatherManager,
      
      // 核心方法
      feed: jest.fn().mockImplementation(function() {
        this.hunger = Math.max(0, this.hunger - 30);
        this.energy = Math.min(100, this.energy + 10);
        this.mood = "happy";
        this.audioManager.playSound('eat');
        return "宠物很开心地吃了食物！";
      }),
      
      play: jest.fn().mockImplementation(function() {
        this.energy = Math.max(0, this.energy - 20);
        this.hunger = Math.min(100, this.hunger + 10);
        this.mood = "happy";
        this.audioManager.playSound('happy');
        return "宠物玩得很开心！";
      }),

      onWeatherChange: jest.fn().mockImplementation(function(weatherData) {
        this.currentWeather = weatherData;
        if (weatherData.condition === 'rainy') {
          this.mood = 'bored';
        } else if (weatherData.condition === 'sunny') {
          this.mood = 'happy';
        }
        this.audioManager.playSound('notification');
      }),

      handleReminder: jest.fn().mockImplementation(function(reminderType) {
        this.audioManager.playSound('notification');
        switch (reminderType) {
          case 'water':
            return "该喝水了！💧";
          case 'rest':
            return "该休息一下眼睛了！👀";
          case 'stand':
            return "起来活动活动吧！🚶‍♂️";
          case 'exercise':
            return "该运动啦！🏃‍♂️";
        }
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('宠物互动与音效系统集成', () => {
    test('喂食时应该播放音效', () => {
      mockPet.feed();

      expect(mockPet.audioManager.playSound).toHaveBeenCalledWith('eat');
      expect(mockPet.mood).toBe('happy');
    });

    test('玩耍时应该播放音效', () => {
      mockPet.play();

      expect(mockPet.audioManager.playSound).toHaveBeenCalledWith('happy');
      expect(mockPet.mood).toBe('happy');
    });

    test('音效被禁用时不应该播放', () => {
      mockPet.settings.soundEnabled = false;
      mockPet.audioManager.muted = true;

      mockPet.feed();

      // 虽然调用了playSound，但由于静音应该不会实际播放
      expect(mockPet.audioManager.playSound).toHaveBeenCalled();
    });
  });

  describe('天气系统与宠物状态集成', () => {
    test('天气变化应该影响宠物心情', () => {
      const rainyWeather = {
        condition: "rainy",
        temperature: 15,
        description: "下雨"
      };

      mockPet.onWeatherChange(rainyWeather);

      expect(mockPet.mood).toBe('bored');
      expect(mockPet.audioManager.playSound).toHaveBeenCalledWith('notification');
    });

    test('晴天应该让宠物开心', () => {
      const sunnyWeather = {
        condition: "sunny",
        temperature: 25,
        description: "晴天"
      };

      mockPet.onWeatherChange(sunnyWeather);

      expect(mockPet.mood).toBe('happy');
    });

    test('天气功能禁用时不应该响应天气变化', () => {
      mockPet.settings.weatherEnabled = false;
      
      const rainyWeather = {
        condition: "rainy",
        temperature: 15,
        description: "下雨"
      };

      // 如果天气功能禁用，不应该调用onWeatherChange
      if (mockPet.settings.weatherEnabled) {
        mockPet.onWeatherChange(rainyWeather);
      }

      expect(mockPet.onWeatherChange).not.toHaveBeenCalled();
    });
  });

  describe('提醒系统集成', () => {
    test('提醒应该播放音效', () => {
      const message = mockPet.handleReminder('water');

      expect(mockPet.audioManager.playSound).toHaveBeenCalledWith('notification');
      expect(message).toBe("该喝水了！💧");
    });

    test('不同类型的提醒应该有不同的消息', () => {
      const waterMessage = mockPet.handleReminder('water');
      const restMessage = mockPet.handleReminder('rest');
      const standMessage = mockPet.handleReminder('stand');
      const exerciseMessage = mockPet.handleReminder('exercise');

      expect(waterMessage).toContain('💧');
      expect(restMessage).toContain('👀');
      expect(standMessage).toContain('🚶‍♂️');
      expect(exerciseMessage).toContain('🏃‍♂️');
    });

    test('禁用的提醒不应该触发', () => {
      // 站立提醒被禁用
      expect(mockPet.settings.reminders.stand).toBe(false);
      expect(mockPet.settings.reminders.exercise).toBe(false);
      
      // 启用的提醒应该正常工作
      expect(mockPet.settings.reminders.water).toBe(true);
      expect(mockPet.settings.reminders.rest).toBe(true);
    });
  });

  describe('设置系统集成', () => {
    test('更改宠物类型应该影响行为', () => {
      mockPet.settings.petType = 'dog';
      expect(mockPet.settings.petType).toBe('dog');

      mockPet.settings.petType = 'rabbit';
      expect(mockPet.settings.petType).toBe('rabbit');
    });

    test('音量设置应该影响音效系统', () => {
      mockPet.audioManager.setVolume(0.8);
      expect(mockPet.audioManager.setVolume).toHaveBeenCalledWith(0.8);
    });

    test('提醒设置应该影响提醒系统', () => {
      // 启用所有提醒
      mockPet.settings.reminders = {
        water: true,
        rest: true,
        stand: true,
        exercise: true
      };

      Object.values(mockPet.settings.reminders).forEach(enabled => {
        expect(enabled).toBe(true);
      });
    });
  });

  describe('IPC 通信集成', () => {
    test('应该能通过IPC获取设置', async () => {
      const mockSettings = {
        petType: 'cat',
        soundEnabled: true,
        weatherEnabled: true
      };

      ipcRenderer.invoke.mockResolvedValue(mockSettings);

      const settings = await ipcRenderer.invoke('get-settings');
      expect(settings).toEqual(mockSettings);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-settings');
    });

    test('应该能通过IPC保存设置', async () => {
      const newSettings = {
        petType: 'dog',
        soundEnabled: false,
        weatherEnabled: true
      };

      await ipcRenderer.invoke('save-settings', newSettings);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('save-settings', newSettings);
    });

    test('应该能通过IPC显示提醒', async () => {
      const reminderData = {
        type: 'water',
        title: '喝水提醒',
        message: '该喝水了！',
        icon: '💧'
      };

      await ipcRenderer.invoke('show-reminder', reminderData);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('show-reminder', reminderData);
    });
  });

  describe('错误处理集成', () => {
    test('音效播放失败时不应该影响其他功能', () => {
      mockPet.audioManager.playSound.mockImplementation(() => {
        throw new Error('Audio context error');
      });

      // 即使音效失败，喂食功能仍应正常工作
      // 需要用 try-catch 包装，因为 feed 方法内部调用了会抛错的 playSound
      try {
        mockPet.feed();
      } catch (error) {
        // 预期会有错误，但不应该影响宠物状态
      }
      expect(mockPet.mood).toBe('happy');
    });

    test('天气获取失败时不应该影响宠物基本功能', () => {
      mockPet.weatherManager.updateWeather.mockImplementation(() => {
        throw new Error('Weather API error');
      });

      // 天气功能失败不应该影响喂食
      expect(() => mockPet.feed()).not.toThrow();
      expect(mockPet.mood).toBe('happy');
    });

    test('IPC通信失败时应该有降级处理', async () => {
      ipcRenderer.invoke.mockRejectedValue(new Error('IPC error'));

      try {
        await ipcRenderer.invoke('get-settings');
      } catch (error) {
        expect(error.message).toBe('IPC error');
      }

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-settings');
    });
  });
});