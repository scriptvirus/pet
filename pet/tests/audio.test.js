// AudioManager 单元测试
const AudioManager = require("../src/audio");

describe("AudioManager", () => {
  let audioManager;
  let mockOscillator;
  let mockGainNode;
  let mockAudioContext;

  beforeEach(() => {
    // 重置模拟对象
    mockOscillator = {
      connect: jest.fn(),
      frequency: { setValueAtTime: jest.fn() },
      type: "sine",
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockGainNode = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockAudioContext = {
      createOscillator: jest.fn().mockReturnValue(mockOscillator),
      createGain: jest.fn().mockReturnValue(mockGainNode),
      destination: {},
      currentTime: 0,
    };

    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

    audioManager = new AudioManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("初始化", () => {
    test("应该正确初始化音频管理器", () => {
      expect(audioManager.volume).toBe(0.5);
      expect(audioManager.muted).toBe(false);
      expect(audioManager.sounds).toEqual({});
      expect(audioManager.soundDefinitions).toBeDefined();
    });

    test("应该包含预定义的音效", () => {
      const expectedSounds = ["click", "happy", "eat", "sleep", "notification"];
      expectedSounds.forEach((sound) => {
        expect(audioManager.soundDefinitions[sound]).toBeDefined();
        expect(audioManager.soundDefinitions[sound]).toHaveProperty(
          "frequency"
        );
        expect(audioManager.soundDefinitions[sound]).toHaveProperty("duration");
        expect(audioManager.soundDefinitions[sound]).toHaveProperty("type");
      });
    });
  });

  describe("播放音效", () => {
    test("应该能播放有效的音效", () => {
      audioManager.playSound("click");

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(
        mockAudioContext.destination
      );
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    test("静音时不应该播放音效", () => {
      audioManager.muted = true;
      audioManager.playSound("click");

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    test("无效音效名称时不应该播放", () => {
      audioManager.playSound("invalid_sound");

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    test("应该根据音效定义设置正确的参数", () => {
      const clickSound = audioManager.soundDefinitions.click;
      audioManager.playSound("click");

      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        clickSound.frequency,
        mockAudioContext.currentTime
      );
      expect(mockOscillator.type).toBe(clickSound.type);
    });
  });

  describe("音量控制", () => {
    test("应该能设置音量", () => {
      audioManager.setVolume(0.8);
      expect(audioManager.volume).toBe(0.8);
    });

    test("音量应该限制在0-1之间", () => {
      audioManager.setVolume(-0.5);
      expect(audioManager.volume).toBe(0);

      audioManager.setVolume(1.5);
      expect(audioManager.volume).toBe(1);
    });

    test("应该能切换静音状态", () => {
      expect(audioManager.muted).toBe(false);

      const result1 = audioManager.toggleMute();
      expect(audioManager.muted).toBe(true);
      expect(result1).toBe(true);

      const result2 = audioManager.toggleMute();
      expect(audioManager.muted).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe("音效参数验证", () => {
    test("click音效应该有正确的参数", () => {
      const click = audioManager.soundDefinitions.click;
      expect(click.frequency).toBe(800);
      expect(click.duration).toBe(0.1);
      expect(click.type).toBe("sine");
    });

    test("happy音效应该有正确的参数", () => {
      const happy = audioManager.soundDefinitions.happy;
      expect(happy.frequency).toBe(600);
      expect(happy.duration).toBe(0.3);
      expect(happy.type).toBe("triangle");
    });

    test("notification音效应该有正确的参数", () => {
      const notification = audioManager.soundDefinitions.notification;
      expect(notification.frequency).toBe(1000);
      expect(notification.duration).toBe(0.2);
      expect(notification.type).toBe("square");
    });
  });
});
