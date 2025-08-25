// Electron 模拟
const mockIpcRenderer = {
  invoke: jest.fn().mockResolvedValue({}),
  on: jest.fn(),
  send: jest.fn(),
  removeListener: jest.fn()
};

const mockApp = {
  whenReady: jest.fn().mockResolvedValue(),
  on: jest.fn(),
  quit: jest.fn()
};

const mockBrowserWindow = jest.fn().mockImplementation(() => ({
  loadFile: jest.fn(),
  webContents: {
    openDevTools: jest.fn(),
    send: jest.fn()
  },
  on: jest.fn(),
  show: jest.fn(),
  hide: jest.fn(),
  close: jest.fn(),
  focus: jest.fn(),
  setPosition: jest.fn(),
  getPosition: jest.fn().mockReturnValue([100, 100]),
  getBounds: jest.fn().mockReturnValue({ width: 400, height: 300 })
}));

const mockScreen = {
  getPrimaryDisplay: jest.fn().mockReturnValue({
    workAreaSize: { width: 1920, height: 1080 }
  })
};

const mockIpcMain = {
  handle: jest.fn(),
  on: jest.fn()
};

module.exports = {
  ipcRenderer: mockIpcRenderer,
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  screen: mockScreen,
  ipcMain: mockIpcMain
};