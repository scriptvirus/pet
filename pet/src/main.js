const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const Store = require("electron-store");

const store = new Store();
let mainWindow;
let settingsWindow;
let reminderWindow;
let currentReminderData = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    x: store.get("windowPosition.x", width - 350),
    y: store.get("windowPosition.y", height - 350),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("src/index.html");

  // 开发模式下打开开发者工具
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // 保存窗口位置
  mainWindow.on("moved", () => {
    const position = mainWindow.getPosition();
    store.set("windowPosition", { x: position[0], y: position[1] });
  });

  // 防止窗口被关闭，而是隐藏
  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC 通信处理
ipcMain.handle("get-screen-size", () => {
  return screen.getPrimaryDisplay().workAreaSize;
});

ipcMain.handle("move-window", (event, x, y) => {
  mainWindow.setPosition(x, y);
});

// 设置相关的 IPC 处理
ipcMain.handle("open-settings", () => {
  createSettingsWindow();
});

ipcMain.handle("close-settings", () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

ipcMain.handle("get-settings", () => {
  return store.get("petSettings", {
    petName: "小宠物",
    petType: "cat",
    volume: 50,
    reminderInterval: 120,
    autoStart: false,
    soundEnabled: true,
    weatherEnabled: true,
    city: "Beijing",
    reminders: {
      water: true,
      rest: true,
      stand: true,
      exercise: false
    }
  });
});

ipcMain.handle("save-settings", (event, settings) => {
  store.set("petSettings", settings);
  // 通知主窗口设置已更新
  if (mainWindow) {
    mainWindow.webContents.send("settings-updated", settings);
  }
});

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 750,
    parent: mainWindow,
    modal: true,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  settingsWindow.loadFile("src/settings.html");

  settingsWindow.once("ready-to-show", () => {
    settingsWindow.show();
  });

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

function createReminderWindow(reminderData) {
  if (reminderWindow) {
    reminderWindow.close();
  }

  currentReminderData = reminderData;

  reminderWindow = new BrowserWindow({
    width: 390,
    height: 240,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  reminderWindow.loadFile("src/reminder.html");

  reminderWindow.once("ready-to-show", () => {
    reminderWindow.show();
    
    // 居中显示
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const winBounds = reminderWindow.getBounds();
    reminderWindow.setPosition(
      Math.round((width - winBounds.width) / 2),
      Math.round((height - winBounds.height) / 2)
    );
  });

  reminderWindow.on("closed", () => {
    reminderWindow = null;
    currentReminderData = null;
  });
}

// 提醒相关的IPC处理
ipcMain.handle("show-reminder", (event, reminderData) => {
  createReminderWindow(reminderData);
});

ipcMain.handle("get-reminder-data", () => {
  return currentReminderData;
});

ipcMain.handle("close-reminder", () => {
  if (reminderWindow) {
    reminderWindow.close();
  }
});

ipcMain.handle("reminder-completed", () => {
  // 提醒完成，可以记录用户行为
  console.log("用户完成了提醒");
});

ipcMain.handle("reminder-delayed", () => {
  // 延迟提醒，10分钟后再次提醒
  console.log("用户延迟了提醒");
  if (mainWindow && currentReminderData) {
    setTimeout(() => {
      mainWindow.webContents.send("delayed-reminder", currentReminderData);
    }, 10 * 60 * 1000); // 10分钟
  }
});
