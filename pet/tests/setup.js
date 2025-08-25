// Jest 测试环境设置
require('@testing-library/jest-dom');

// 模拟 Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    frequency: { setValueAtTime: jest.fn() },
    type: 'sine',
    start: jest.fn(),
    stop: jest.fn()
  }),
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  }),
  destination: {},
  currentTime: 0
}));

// 模拟 DOM 方法
global.document.createElement = jest.fn().mockImplementation((tagName) => {
  const element = {
    tagName: tagName.toUpperCase(),
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue([]),
    getBoundingClientRect: jest.fn().mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100
    })
  };
  return element;
});

// 模拟 setTimeout 和 setInterval
global.setTimeout = jest.fn((fn, delay) => {
  if (typeof fn === 'function') {
    return setTimeout(fn, 0); // 立即执行用于测试
  }
  return 1;
});

global.setInterval = jest.fn((fn, delay) => {
  if (typeof fn === 'function') {
    return setInterval(fn, 0); // 立即执行用于测试
  }
  return 1;
});

global.clearTimeout = jest.fn();
global.clearInterval = jest.fn();