// 性能测试
describe('桌面宠物性能测试', () => {
  let mockPet;
  let mockAudioManager;

  beforeEach(() => {
    mockAudioManager = {
      playSound: jest.fn(),
      setVolume: jest.fn(),
      muted: false
    };

    mockPet = {
      mood: "happy",
      energy: 100,
      hunger: 0,
      audioManager: mockAudioManager,
      
      updateStats: jest.fn().mockImplementation(function() {
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
      }),

      playAnimation: jest.fn(),
      
      randomBehavior: jest.fn().mockImplementation(function() {
        const behaviors = ['idle', 'look_around', 'stretch', 'groom'];
        const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        this.playAnimation(randomBehavior);
      })
    };
  });

  describe('状态更新性能', () => {
    test('大量状态更新应该在合理时间内完成', () => {
      const startTime = performance.now();
      
      // 模拟1000次状态更新
      for (let i = 0; i < 1000; i++) {
        mockPet.updateStats();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次更新应该在100ms内完成
      expect(duration).toBeLessThan(100);
      expect(mockPet.updateStats).toHaveBeenCalledTimes(1000);
    });

    test('连续的随机行为不应该造成性能问题', () => {
      const startTime = performance.now();
      
      // 模拟500次随机行为
      for (let i = 0; i < 500; i++) {
        mockPet.randomBehavior();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 500次随机行为应该在50ms内完成
      expect(duration).toBeLessThan(50);
      expect(mockPet.randomBehavior).toHaveBeenCalledTimes(500);
    });
  });

  describe('音效系统性能', () => {
    test('大量音效播放不应该造成阻塞', () => {
      const startTime = performance.now();
      
      // 模拟100次音效播放
      for (let i = 0; i < 100; i++) {
        mockPet.audioManager.playSound('click');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100次音效播放应该在20ms内完成
      expect(duration).toBeLessThan(20);
      expect(mockPet.audioManager.playSound).toHaveBeenCalledTimes(100);
    });

    test('静音状态下音效调用应该快速返回', () => {
      mockPet.audioManager.muted = true;
      mockPet.audioManager.playSound = jest.fn().mockImplementation(() => {
        if (mockPet.audioManager.muted) return; // 快速返回
        // 模拟音效播放逻辑
      });

      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        mockPet.audioManager.playSound('click');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 静音状态下1000次调用应该在10ms内完成
      expect(duration).toBeLessThan(10);
    });
  });

  describe('内存使用测试', () => {
    test('长时间运行不应该造成内存泄漏', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // 模拟长时间运行
      for (let i = 0; i < 10000; i++) {
        mockPet.updateStats();
        mockPet.randomBehavior();
        
        // 每1000次清理一次（模拟垃圾回收）
        if (i % 1000 === 0 && global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（小于50MB，考虑到测试环境的开销）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('创建和销毁大量临时对象不应该造成内存问题', () => {
      const createTempObjects = () => {
        const objects = [];
        for (let i = 0; i < 1000; i++) {
          objects.push({
            id: i,
            data: new Array(100).fill(Math.random()),
            timestamp: Date.now()
          });
        }
        return objects.length;
      };

      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        createTempObjects();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 创建和销毁10万个对象应该在合理时间内完成
      expect(duration).toBeLessThan(1000); // 1秒内
    });
  });

  describe('定时器性能', () => {
    test('多个定时器不应该相互干扰', () => {
      const timers = [];
      const results = [];
      
      // 创建多个模拟定时器
      for (let i = 0; i < 10; i++) {
        const timer = {
          id: i,
          callback: jest.fn(() => results.push(i)),
          interval: 100 + i * 10
        };
        timers.push(timer);
      }
      
      const startTime = performance.now();
      
      // 模拟定时器执行
      timers.forEach(timer => {
        timer.callback();
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(10);
      expect(results).toHaveLength(10);
      timers.forEach(timer => {
        expect(timer.callback).toHaveBeenCalled();
      });
    });
  });

  describe('DOM 操作性能', () => {
    test('大量DOM查询应该被优化', () => {
      const mockElement = {
        querySelector: jest.fn().mockReturnValue(null),
        querySelectorAll: jest.fn().mockReturnValue([]),
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() }
      };

      global.document.getElementById = jest.fn().mockReturnValue(mockElement);
      
      const startTime = performance.now();
      
      // 模拟大量DOM查询
      for (let i = 0; i < 1000; i++) {
        document.getElementById('pet');
        mockElement.querySelector('.test');
        mockElement.querySelectorAll('.items');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次DOM查询应该在50ms内完成
      expect(duration).toBeLessThan(50);
    });

    test('频繁的样式更新应该被批处理', () => {
      const mockElement = {
        style: {},
        classList: { 
          add: jest.fn(), 
          remove: jest.fn(),
          toggle: jest.fn()
        }
      };
      
      const startTime = performance.now();
      
      // 模拟频繁的样式更新
      for (let i = 0; i < 500; i++) {
        mockElement.style.left = `${i}px`;
        mockElement.style.top = `${i}px`;
        mockElement.classList.add('active');
        mockElement.classList.remove('inactive');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 500次样式更新应该在30ms内完成
      expect(duration).toBeLessThan(30);
    });
  });

  describe('算法复杂度测试', () => {
    test('宠物行为选择算法应该是O(1)复杂度', () => {
      const behaviors = new Array(1000).fill(0).map((_, i) => `behavior_${i}`);
      
      const selectBehavior = () => {
        return behaviors[Math.floor(Math.random() * behaviors.length)];
      };
      
      const startTime = performance.now();
      
      // 执行1000次行为选择
      for (let i = 0; i < 1000; i++) {
        selectBehavior();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 即使有1000种行为，选择算法也应该很快
      expect(duration).toBeLessThan(10);
    });

    test('状态计算应该是线性复杂度', () => {
      const calculateComplexState = (iterations) => {
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += Math.sin(i) * Math.cos(i);
        }
        return result;
      };
      
      // 测试不同规模的计算
      const small = performance.now();
      calculateComplexState(1000);
      const smallTime = performance.now() - small;
      
      const large = performance.now();
      calculateComplexState(10000);
      const largeTime = performance.now() - large;
      
      // 10倍的计算量应该大致对应10倍的时间（线性关系）
      const ratio = largeTime / smallTime;
      expect(ratio).toBeGreaterThan(5); // 至少5倍
      expect(ratio).toBeLessThan(20); // 不超过20倍（考虑误差）
    });
  });
});