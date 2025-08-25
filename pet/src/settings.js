const { ipcRenderer } = require('electron');

class SettingsManager {
    constructor() {
        this.settings = {};
        this.init();
    }

    async init() {
        // 加载设置
        this.settings = await ipcRenderer.invoke('get-settings');
        this.populateForm();
        this.bindEvents();
    }

    populateForm() {
        // 填充表单
        document.getElementById('petName').value = this.settings.petName || '';
        document.getElementById('volumeSlider').value = this.settings.volume || 50;
        document.getElementById('volumeValue').textContent = this.settings.volume || 50;
        document.getElementById('reminderInterval').value = this.settings.reminderInterval || 120;
        document.getElementById('reminderValue').textContent = this.settings.reminderInterval || 120;
        document.getElementById('autoStart').checked = this.settings.autoStart || false;
        document.getElementById('soundEnabled').checked = this.settings.soundEnabled !== false;
        document.getElementById('weatherEnabled').checked = this.settings.weatherEnabled !== false;
        document.getElementById('cityInput').value = this.settings.city || 'Beijing';

        // 提醒设置
        const reminders = this.settings.reminders || {};
        document.getElementById('waterReminder').checked = reminders.water !== false;
        document.getElementById('restReminder').checked = reminders.rest !== false;
        document.getElementById('standReminder').checked = reminders.stand !== false;
        document.getElementById('exerciseReminder').checked = reminders.exercise || false;

        // 选择宠物类型
        const petType = this.settings.petType || 'cat';
        document.querySelector(`[data-type="${petType}"]`).classList.add('selected');
    }

    bindEvents() {
        // 音量滑块
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value;
        });

        // 提醒间隔滑块
        const reminderSlider = document.getElementById('reminderInterval');
        const reminderValue = document.getElementById('reminderValue');
        reminderSlider.addEventListener('input', (e) => {
            reminderValue.textContent = e.target.value;
        });

        // 宠物类型选择
        document.querySelectorAll('.pet-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.pet-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        // 保存按钮
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // 取消按钮
        document.getElementById('cancelBtn').addEventListener('click', () => {
            ipcRenderer.invoke('close-settings');
        });
    }

    async saveSettings() {
        const settings = {
            petName: document.getElementById('petName').value,
            petType: document.querySelector('.pet-option.selected').dataset.type,
            volume: parseInt(document.getElementById('volumeSlider').value),
            reminderInterval: parseInt(document.getElementById('reminderInterval').value),
            autoStart: document.getElementById('autoStart').checked,
            soundEnabled: document.getElementById('soundEnabled').checked,
            weatherEnabled: document.getElementById('weatherEnabled').checked,
            city: document.getElementById('cityInput').value || 'Beijing',
            reminders: {
                water: document.getElementById('waterReminder').checked,
                rest: document.getElementById('restReminder').checked,
                stand: document.getElementById('standReminder').checked,
                exercise: document.getElementById('exerciseReminder').checked
            }
        };

        await ipcRenderer.invoke('save-settings', settings);
        ipcRenderer.invoke('close-settings');
    }
}

// 初始化设置管理器
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});