/*
 * @Author: YoungChen1234 189687676@qq.com
 * @Date: 2025-08-15 17:25:37
 * @LastEditors: YoungChen1234 189687676@qq.com
 * @LastEditTime: 2025-08-25 14:46:06
 * @FilePath: /pet/src/audio.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
class AudioManager {
  constructor() {
    this.sounds = {};
    this.volume = 0.5;
    this.muted = false;
    this.initSounds();
  }

  initSounds() {
    // 使用 Web Audio API 生成简单的音效
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // 预定义音效
    this.soundDefinitions = {
      click: { frequency: 800, duration: 0.1, type: "sine" },
      happy: { frequency: 600, duration: 0.3, type: "triangle" },
      eat: { frequency: 400, duration: 0.5, type: "sawtooth" },
      sleep: { frequency: 200, duration: 1.0, type: "sine" },
      notification: { frequency: 1000, duration: 0.2, type: "square" },
    };
  }

  playSound(soundName) {
    if (this.muted || !this.soundDefinitions[soundName]) return;

    const sound = this.soundDefinitions[soundName];
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(
      sound.frequency,
      this.audioContext.currentTime
    );
    oscillator.type = sound.type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      this.volume * 0.3,
      this.audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + sound.duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + sound.duration);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

module.exports = AudioManager;
