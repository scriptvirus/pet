const { ipcRenderer } = require('electron');

class ReminderWindow {
    constructor() {
        this.init();
    }

    init() {
        // 获取提醒数据
        ipcRenderer.invoke('get-reminder-data').then(data => {
            this.setupReminder(data);
        });

        // 绑定按钮事件
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.closeReminder();
        });

        document.getElementById('doneBtn').addEventListener('click', () => {
            this.completeReminder();
        });

        document.getElementById('delayBtn').addEventListener('click', () => {
            this.delayReminder();
        });

        // 自动关闭定时器
        setTimeout(() => {
            this.closeReminder();
        }, 30000); // 30秒后自动关闭
    }

    setupReminder(data) {
        const { type, title, message, icon } = data;
        
        document.getElementById('reminderIcon').textContent = icon;
        document.getElementById('reminderTitle').textContent = title;
        document.getElementById('reminderMessage').textContent = message;

        // 根据提醒类型设置不同的样式
        const container = document.querySelector('.reminder-container');
        switch (type) {
            case 'water':
                container.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
                break;
            case 'rest':
                container.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
                break;
            case 'stand':
                container.style.background = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
                break;
            case 'exercise':
                container.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
                break;
            default:
                container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }

    completeReminder() {
        ipcRenderer.invoke('reminder-completed');
        this.closeReminder();
    }

    delayReminder() {
        ipcRenderer.invoke('reminder-delayed');
        this.closeReminder();
    }

    closeReminder() {
        ipcRenderer.invoke('close-reminder');
    }
}

// 初始化提醒窗口
document.addEventListener('DOMContentLoaded', () => {
    new ReminderWindow();
});