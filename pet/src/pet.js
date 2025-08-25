const { ipcRenderer } = require("electron");

class WeatherManager {
  constructor() {
    this.currentWeather = null;
    this.lastUpdate = 0;
    this.updateInterval = 30 * 60 * 1000; // 30分钟更新一次
    this.city = "Beijing"; // 默认城市

    this.init();
  }

  async init() {
    // 获取天气信息
    await this.updateWeather();

    // 定期更新天气
    setInterval(() => {
      this.updateWeather();
    }, this.updateInterval);
  }

  async updateWeather() {
    try {
      // 模拟天气数据（实际应用中应该调用真实的天气API）
      const weatherData = await this.getSimulatedWeather();

      if (weatherData) {
        this.currentWeather = weatherData;
        this.lastUpdate = Date.now();

        // 通知宠物天气变化
        if (window.desktopPet) {
          console.log("通知宠物天气变化:", weatherData);
          window.desktopPet.onWeatherChange(weatherData);
        }
      }
    } catch (error) {
      console.error("获取天气信息失败:", error);
    }
  }

  async getSimulatedWeather() {
    // 模拟不同的天气条件
    const weatherTypes = [
      { condition: "sunny", temperature: 25, description: "晴天" },
      { condition: "cloudy", temperature: 20, description: "多云" },
      { condition: "rainy", temperature: 15, description: "下雨" },
      { condition: "snowy", temperature: -5, description: "下雪" },
      { condition: "windy", temperature: 18, description: "大风" },
    ];

    // 根据时间模拟不同天气
    const hour = new Date().getHours();
    let weatherIndex;

    if (hour >= 6 && hour <= 18) {
      // 白天更可能是晴天或多云
      weatherIndex =
        Math.random() < 0.6
          ? 0
          : Math.floor(Math.random() * weatherTypes.length);
    } else {
      // 夜晚更可能是多云或其他天气
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
}

class DesktopPet {
  constructor() {
    this.pet = document.getElementById("pet");
    this.contextMenu = document.getElementById("context-menu");
    this.statusDisplay = document.getElementById("status-display");
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.mood = "happy"; // happy, bored, sleepy, hungry
    this.energy = 100;
    this.hunger = 0;
    this.settings = {};
    this.audioManager = null;
    this.statusVisible = false;
    this.reminderTimers = {};
    this.currentWeather = null;
    this.weatherElements = [];

    // 全局引用，供天气模块使用
    window.desktopPet = this;

    this.init();
    this.loadSettings().then(() => {
      this.initWeather();
    });
    this.startBehaviorLoop();
  }

  init() {
    // 点击事件
    this.pet.addEventListener("click", (e) => {
      if (!this.isDragging) {
        this.playHappyAnimation();
        this.playSound("click");
      }
    });

    // 拖拽事件
    this.pet.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.pet.classList.add("dragging");

      const rect = this.pet.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;

      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const x = e.screenX - this.dragOffset.x;
        const y = e.screenY - this.dragOffset.y;
        ipcRenderer.invoke("move-window", x, y);
      }
    });

    document.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.pet.classList.remove("dragging");
      }
    });

    // 右键菜单
    this.pet.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });

    // 点击其他地方隐藏菜单和状态
    document.addEventListener("click", (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
      if (
        !this.statusDisplay.contains(e.target) &&
        !this.pet.contains(e.target)
      ) {
        this.hideStatus();
      }
    });

    // 菜单项点击
    this.contextMenu.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleMenuAction(action);
        this.hideContextMenu();
      }
    });
  }

  playHappyAnimation() {
    const petType = this.settings.petType || "cat";
    this.pet.className = `pet-happy pet-${petType}`;

    // 根据宠物类型播放不同的开心动画
    this.playTypeSpecificHappyAnimation(petType);

    setTimeout(() => {
      this.pet.className = `pet-idle pet-${petType}`;
    }, 1500);
  }

  playTypeSpecificHappyAnimation(petType) {
    const currentPet = document.getElementById(`${petType}-pet`);
    if (!currentPet) return;

    switch (petType) {
      case "cat":
        // 猫咪开心时耳朵会动
        const catEars = currentPet.querySelectorAll(".ear");
        catEars.forEach((ear) => {
          ear.style.animation = "cat-ear-wiggle 0.3s ease-in-out 3";
        });
        setTimeout(() => {
          catEars.forEach((ear) => (ear.style.animation = ""));
        }, 1000);
        break;

      case "dog":
        // 狗狗开心时尾巴摇得更快
        const dogTail = currentPet.querySelector(".tail");
        if (dogTail) {
          dogTail.style.animation =
            "dog-tail-wag-fast 0.3s ease-in-out infinite";
          setTimeout(() => {
            dogTail.style.animation = "dog-tail-wag 0.8s ease-in-out infinite";
          }, 1500);
        }
        break;

      case "rabbit":
        // 兔子开心时会跳跃
        const rabbitBody = currentPet.querySelector(".pet-body-svg");
        if (rabbitBody) {
          rabbitBody.style.animation = "rabbit-hop 0.4s ease-in-out 3";
          setTimeout(() => {
            rabbitBody.style.animation = "";
          }, 1200);
        }
        break;

      case "sheep":
        // 小羊开心时会跳跃，羊毛会抖动
        const sheepWool = currentPet.querySelectorAll(".wool");
        sheepWool.forEach((wool) => {
          wool.style.animation = "sheep-wool-bounce 0.3s ease-in-out 5";
        });
        const sheepBody = currentPet.querySelector(".pet-body-svg");
        if (sheepBody) {
          sheepBody.style.animation = "sheep-hop 0.5s ease-in-out 3";
        }
        setTimeout(() => {
          sheepWool.forEach(
            (wool) =>
              (wool.style.animation =
                "sheep-wool-bounce 2.5s ease-in-out infinite")
          );
          if (sheepBody) sheepBody.style.animation = "";
        }, 1500);
        break;

      case "owl":
        // 猫头鹰开心时会扇翅膀
        const owlWings = currentPet.querySelectorAll(".wing");
        owlWings.forEach((wing) => {
          wing.style.animation = "owl-wing-flap 0.2s ease-in-out 8";
        });
        const owlHead = currentPet.querySelector(".pet-head");
        if (owlHead) {
          owlHead.style.animation = "owl-head-turn 0.5s ease-in-out 3";
        }
        setTimeout(() => {
          owlWings.forEach(
            (wing) =>
              (wing.style.animation = "owl-wing-flap 3s ease-in-out infinite")
          );
          if (owlHead) owlHead.style.animation = "";
        }, 1600);
        break;
    }
  }

  playEatingAnimation() {
    const petType = this.settings.petType || "cat";
    this.pet.className = `pet-eating pet-${petType}`;

    // 根据宠物类型播放不同的吃东西动画
    this.playTypeSpecificEatingAnimation(petType);

    setTimeout(() => {
      this.pet.className = `pet-idle pet-${petType}`;
    }, 2400);
  }

  playTypeSpecificEatingAnimation(petType) {
    const currentPet = document.getElementById(`${petType}-pet`);
    if (!currentPet) return;

    switch (petType) {
      case "cat":
        // 猫咪吃东西时会舔
        const catMouth = currentPet.querySelectorAll(".mouth");
        catMouth.forEach((mouth) => {
          mouth.style.animation = "cat-lick 0.5s ease-in-out 4";
        });
        break;

      case "dog":
        // 狗狗吃东西时舌头会动
        const dogTongue = currentPet.querySelector(".tongue");
        if (dogTongue) {
          dogTongue.style.animation = "dog-eat 0.4s ease-in-out 6";
        }
        break;

      case "rabbit":
        // 兔子吃东西时嘴巴会动
        const rabbitMouth = currentPet.querySelector(".mouth");
        if (rabbitMouth) {
          rabbitMouth.style.animation = "rabbit-chew 0.3s ease-in-out 8";
        }
        break;

      case "sheep":
        // 小羊吃东西时会咀嚼
        const sheepMouth = currentPet.querySelectorAll(".mouth");
        sheepMouth.forEach((mouth) => {
          mouth.style.animation = "sheep-chew 0.4s ease-in-out 6";
        });
        break;

      case "owl":
        // 猫头鹰吃东西时喙会动
        const owlBeak = currentPet.querySelector(".beak");
        if (owlBeak) {
          owlBeak.style.animation = "sheep-chew 0.3s ease-in-out 8";
        }
        break;
    }
  }

  setSleepingState(sleeping) {
    const petType = this.settings.petType || "cat";

    if (sleeping) {
      this.pet.className = `pet-sleeping pet-${petType}`;
      this.playTypeSpecificSleepAnimation(petType);
    } else {
      this.pet.className = `pet-idle pet-${petType}`;
    }
  }

  playTypeSpecificSleepAnimation(petType) {
    const currentPet = document.getElementById(`${petType}-pet`);
    if (!currentPet) return;

    // 所有宠物睡觉时眼睛都会闭上
    const eyes = currentPet.querySelectorAll(".eye");
    eyes.forEach((eye) => {
      eye.style.transform = "scaleY(0.1)";
    });

    // 根据类型添加特殊睡眠动画
    switch (petType) {
      case "cat":
        // 猫咪睡觉时会蜷缩
        const catBody = currentPet.querySelector(".pet-body-svg");
        if (catBody) {
          catBody.style.transform = "scale(0.9)";
        }
        break;

      case "sheep":
        // 小羊睡觉时羊毛会轻微起伏
        const sheepWool = currentPet.querySelectorAll(".wool");
        sheepWool.forEach((wool) => {
          wool.style.animation = "sleep-breathe 3s ease-in-out infinite";
        });
        break;

      case "owl":
        // 猫头鹰睡觉时头会微微下垂
        const owlHead = currentPet.querySelector(".pet-head");
        if (owlHead) {
          owlHead.style.transform = "rotate(5deg)";
        }
        break;
    }
  }

  showContextMenu(x, y) {
    this.contextMenu.style.left = x + "px";
    this.contextMenu.style.top = y + "px";
    this.contextMenu.classList.remove("hidden");
  }

  hideContextMenu() {
    this.contextMenu.classList.add("hidden");
  }

  handleMenuAction(action) {
    switch (action) {
      case "feed":
        this.feed();
        break;
      case "play":
        this.play();
        break;
      case "sleep":
        this.sleep();
        break;
      case "status":
        this.toggleStatus();
        break;
      case "weather":
        this.toggleWeather();
        break;
      case "settings":
        this.openSettings();
        break;
      case "hide":
        this.hide();
        break;
    }
  }

  toggleWeather() {
    const weatherDisplay = document.getElementById("weather-display");
    if (!weatherDisplay) return;

    if (weatherDisplay.classList.contains("hidden")) {
      // 如果天气管理器存在，先更新天气
      if (this.weatherManager) {
        this.weatherManager.updateWeather();
      }
      this.showWeather();
    } else {
      this.hideWeather();
    }
  }

  showWeather() {
    const weatherDisplay = document.getElementById("weather-display");
    if (!weatherDisplay) return;

    weatherDisplay.classList.remove("hidden");

    if (this.currentWeather) {
      this.updateWeatherDisplay();
    } else {
      // 显示默认天气信息
      const weatherIcon = document.getElementById("weatherIcon");
      const weatherTemp = document.getElementById("weatherTemp");
      const weatherDesc = document.getElementById("weatherDesc");

      if (weatherIcon) weatherIcon.textContent = "🌤️";
      if (weatherTemp) weatherTemp.textContent = "--°C";
      if (weatherDesc) weatherDesc.textContent = "获取中...";
    }

    // 5秒后自动隐藏
    setTimeout(() => {
      this.hideWeather();
    }, 5000);
  }

  hideWeather() {
    const weatherDisplay = document.getElementById("weather-display");
    weatherDisplay.classList.add("hidden");
  }

  updateWeatherDisplay() {
    if (!this.currentWeather) return;

    const weatherIcons = {
      sunny: "☀️",
      cloudy: "☁️",
      rainy: "🌧️",
      snowy: "❄️",
      windy: "💨",
      stormy: "⛈️",
      foggy: "🌫️",
    };

    const weatherIcon = document.getElementById("weatherIcon");
    const weatherTemp = document.getElementById("weatherTemp");
    const weatherDesc = document.getElementById("weatherDesc");

    if (weatherIcon)
      weatherIcon.textContent =
        weatherIcons[this.currentWeather.condition] || "🌤️";
    if (weatherTemp)
      weatherTemp.textContent = `${this.currentWeather.temperature}°C`;
    if (weatherDesc) weatherDesc.textContent = this.currentWeather.description;
  }

  feed() {
    this.playEatingAnimation();
    this.hunger = Math.max(0, this.hunger - 30);
    this.energy = Math.min(100, this.energy + 10);
    this.mood = "happy";
    this.showNotification("宠物很开心地吃了食物！");
  }

  play() {
    this.playHappyAnimation();
    this.energy = Math.max(0, this.energy - 20);
    this.hunger = Math.min(100, this.hunger + 10);
    this.mood = "happy";
    this.showNotification("宠物玩得很开心！");
  }

  sleep() {
    this.setSleepingState(true);
    this.energy = Math.min(100, this.energy + 50);
    this.mood = "sleepy";
    this.showNotification("宠物开始睡觉了...");

    setTimeout(() => {
      this.setSleepingState(false);
      this.mood = "happy";
      this.showNotification("宠物睡醒了！");
    }, 5000);
  }

  openSettings() {
    ipcRenderer.invoke("open-settings");
  }

  hide() {
    // TODO: 实现隐藏功能
    this.showNotification("再见！");
  }

  startBehaviorLoop() {
    setInterval(() => {
      this.updateStats();
      this.randomBehavior();
    }, 30000); // 每30秒更新一次

    // 定时提醒
    setInterval(() => {
      this.checkReminders();
    }, 300000); // 每5分钟检查一次提醒
  }

  updateStats() {
    this.hunger = Math.min(100, this.hunger + 2);
    this.energy = Math.max(0, this.energy - 1);

    // 根据状态更新情绪
    if (this.hunger > 80) {
      this.mood = "hungry";
    } else if (this.energy < 20) {
      this.mood = "sleepy";
    } else if (this.energy > 80 && this.hunger < 30) {
      this.mood = "happy";
    } else {
      this.mood = "bored";
    }

    // 更新状态显示
    this.updateStatusDisplay();
  }

  updateStatusDisplay() {
    if (!this.statusVisible) return;

    // 更新精力条
    const energyFill = document.querySelector(".energy-fill");
    const energyValue = document.querySelector(".energy-value");
    if (energyFill) energyFill.style.width = this.energy + "%";
    if (energyValue) energyValue.textContent = this.energy;

    // 更新饥饿条
    const hungerFill = document.querySelector(".hunger-fill");
    const hungerValue = document.querySelector(".hunger-value");
    if (hungerFill) hungerFill.style.width = this.hunger + "%";
    if (hungerValue) hungerValue.textContent = this.hunger;

    // 更新心情指示器
    const moodIndicator = document.querySelector(".mood-indicator");
    const moodEmojis = {
      happy: "😊",
      bored: "😐",
      sleepy: "😴",
      hungry: "😋",
    };
    if (moodIndicator) moodIndicator.textContent = moodEmojis[this.mood] || "😊";
  }

  toggleStatus() {
    console.log('切换状态显示，当前状态:', this.statusVisible);
    if (this.statusVisible) {
      this.hideStatus();
    } else {
      this.showStatus();
    }
  }

  showStatus() {
    if (!this.statusDisplay) {
      console.error('状态显示元素未找到');
      return;
    }
    
    this.statusDisplay.classList.remove("hidden");
    this.statusVisible = true;
    this.updateStatusDisplay();

    // 3秒后自动隐藏
    setTimeout(() => {
      this.hideStatus();
    }, 3000);
  }

  hideStatus() {
    if (!this.statusDisplay) return;
    
    this.statusDisplay.classList.add("hidden");
    this.statusVisible = false;
  }

  randomBehavior() {
    const petType = this.settings.petType || "cat";
    const traits = this.behaviorTraits || {};

    // 根据宠物类型和特征决定行为
    const behaviors = this.getPetSpecificBehaviors(petType);
    const randomBehavior =
      behaviors[Math.floor(Math.random() * behaviors.length)];

    // 根据心情和特征调整行为概率
    if (this.mood === "happy" && Math.random() < traits.playfulness) {
      this.playHappyAnimation();
      this.playSound("happy");
    } else if (this.mood === "sleepy" && Math.random() < traits.sleepiness) {
      this.playLookAroundAnimation();
    } else {
      this.executeRandomBehavior(randomBehavior, petType);
    }
  }

  getPetSpecificBehaviors(petType) {
    switch (petType) {
      case "cat":
        return ["stretch", "groom", "look_around", "tail_flick"];
      case "dog":
        return ["wag_tail", "pant", "look_around", "play_bow"];
      case "rabbit":
        return ["ear_twitch", "nose_wiggle", "hop", "look_around"];
      case "sheep":
        return ["wool_shake", "bleat", "graze", "hop"];
      case "owl":
        return ["head_turn", "wing_stretch", "hoot", "eye_track"];
      default:
        return ["look_around"];
    }
  }

  executeRandomBehavior(behavior, petType) {
    const currentPet = document.getElementById(`${petType}-pet`);
    if (!currentPet) return;

    switch (behavior) {
      case "stretch":
        this.playStretchAnimation(currentPet);
        break;
      case "groom":
        this.playGroomAnimation(currentPet);
        break;
      case "wag_tail":
        this.playTailWagAnimation(currentPet);
        break;
      case "pant":
        this.playPantAnimation(currentPet);
        break;
      case "ear_twitch":
        this.playEarTwitchAnimation(currentPet);
        break;
      case "nose_wiggle":
        this.playNoseWiggleAnimation(currentPet);
        break;
      case "hop":
        this.playHopAnimation(currentPet);
        break;
      case "wool_shake":
        this.playWoolShakeAnimation(currentPet);
        break;
      case "bleat":
        this.playBleatAnimation(currentPet);
        break;
      case "graze":
        this.playGrazeAnimation(currentPet);
        break;
      case "head_turn":
        this.playHeadTurnAnimation(currentPet);
        break;
      case "wing_stretch":
        this.playWingStretchAnimation(currentPet);
        break;
      case "hoot":
        this.playHootAnimation(currentPet);
        break;
      case "eye_track":
        this.playEyeTrackAnimation(currentPet);
        break;
      case "look_around":
        this.playLookAroundAnimation();
        break;
    }
  }

  playStretchAnimation(pet) {
    const body = pet.querySelector(".pet-body-svg");
    if (body) {
      body.style.animation = "stretch 2s ease-in-out";
      setTimeout(() => (body.style.animation = ""), 2000);
    }
  }

  playGroomAnimation(pet) {
    const head = pet.querySelector(".pet-head");
    if (head) {
      head.style.animation = "groom 1.5s ease-in-out";
      setTimeout(() => (head.style.animation = ""), 1500);
    }
  }

  playTailWagAnimation(pet) {
    const tail = pet.querySelector(".tail");
    if (tail) {
      tail.style.animation = "dog-tail-wag-fast 0.3s ease-in-out 5";
      setTimeout(
        () => (tail.style.animation = "dog-tail-wag 0.8s ease-in-out infinite"),
        1500
      );
    }
  }

  playPantAnimation(pet) {
    const tongue = pet.querySelector(".tongue");
    if (tongue) {
      tongue.style.animation = "pant-fast 0.5s ease-in-out 6";
      setTimeout(
        () => (tongue.style.animation = "pant 1.5s ease-in-out infinite"),
        3000
      );
    }
  }

  playEarTwitchAnimation(pet) {
    const ears = pet.querySelectorAll(".ear");
    ears.forEach((ear) => {
      ear.style.animation = "rabbit-ear-twitch-fast 0.3s ease-in-out 4";
      setTimeout(
        () =>
          (ear.style.animation = "rabbit-ear-twitch 3s ease-in-out infinite"),
        1200
      );
    });
  }

  playNoseWiggleAnimation(pet) {
    const nose = pet.querySelector(".nose");
    if (nose) {
      nose.style.animation = "nose-wiggle 0.2s ease-in-out 8";
      setTimeout(() => (nose.style.animation = ""), 1600);
    }
  }

  playHopAnimation(pet) {
    const body = pet.querySelector(".pet-body-svg");
    if (body) {
      body.style.animation = "rabbit-hop 0.4s ease-in-out 3";
      setTimeout(() => (body.style.animation = ""), 1200);
    }
  }

  playWoolShakeAnimation(pet) {
    const wool = pet.querySelectorAll(".wool");
    wool.forEach((w) => {
      w.style.animation = "sheep-wool-bounce 0.2s ease-in-out 10";
      setTimeout(
        () =>
          (w.style.animation = "sheep-wool-bounce 2.5s ease-in-out infinite"),
        2000
      );
    });
  }

  playBleatAnimation(pet) {
    const mouth = pet.querySelectorAll(".mouth");
    mouth.forEach((m) => {
      m.style.animation = "sheep-bleat 0.5s ease-in-out 4";
      setTimeout(() => (m.style.animation = ""), 2000);
    });
    this.playSound("bleat");
  }

  playGrazeAnimation(pet) {
    const head = pet.querySelector(".pet-head");
    if (head) {
      head.style.animation = "groom 1s ease-in-out 3";
      setTimeout(() => (head.style.animation = ""), 3000);
    }
  }

  playHeadTurnAnimation(pet) {
    const head = pet.querySelector(".pet-head");
    if (head) {
      head.style.animation = "owl-head-turn 1.5s ease-in-out";
      setTimeout(() => (head.style.animation = ""), 1500);
    }
  }

  playWingStretchAnimation(pet) {
    const wings = pet.querySelectorAll(".wing");
    wings.forEach((wing) => {
      wing.style.animation = "stretch 2s ease-in-out";
      setTimeout(
        () => (wing.style.animation = "owl-wing-flap 3s ease-in-out infinite"),
        2000
      );
    });
  }

  playHootAnimation(pet) {
    const beak = pet.querySelector(".beak");
    if (beak) {
      beak.style.animation = "sheep-bleat 0.3s ease-in-out 6";
      setTimeout(() => (beak.style.animation = ""), 1800);
    }
    this.playSound("hoot");
  }

  playEyeTrackAnimation(pet) {
    const iris = pet.querySelectorAll(".eye-iris");
    iris.forEach((i) => {
      i.style.animation = "owl-eye-track 2s ease-in-out";
      setTimeout(
        () => (i.style.animation = "owl-eye-track 4s ease-in-out infinite"),
        2000
      );
    });
  }

  playLookAroundAnimation() {
    // 眼睛左右看的动画
    const currentPet = document.getElementById(
      `${this.settings.petType || "cat"}-pet`
    );
    if (!currentPet) return;

    const eyes = currentPet.querySelectorAll(".eye");
    eyes.forEach((eye) => {
      eye.style.animation = "look-around 2s ease-in-out";
      setTimeout(
        () => (eye.style.animation = "blink 4s ease-in-out infinite"),
        2000
      );
    });
  }

  checkReminders() {
    const now = Date.now();
    const reminderInterval =
      (this.settings.reminderInterval || 120) * 60 * 1000; // 转换为毫秒

    if (!this.lastReminderTime) {
      this.lastReminderTime = now;
      return;
    }

    if (now - this.lastReminderTime >= reminderInterval) {
      const reminders = [
        "该喝水了！💧",
        "该休息一下眼睛了！👀",
        "起来活动活动吧！🚶‍♂️",
        "记得保持好心情哦！😊",
      ];

      const randomReminder =
        reminders[Math.floor(Math.random() * reminders.length)];
      this.showNotification(randomReminder);
      this.playSound("notification");
      this.playHappyAnimation();

      this.lastReminderTime = now;
    }
  }

  showNotification(message) {
    // 创建临时通知
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            transition: all 0.3s ease;
            pointer-events: none;
        `;

    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => {
      notification.style.top = "10px";
    }, 100);

    // 3秒后消失
    setTimeout(() => {
      notification.style.top = "-50px";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  async loadSettings() {
    this.settings = await ipcRenderer.invoke("get-settings");
    this.initAudio();
    this.updatePetAppearance();
    this.setupReminders();

    // 监听设置更新
    ipcRenderer.on("settings-updated", (event, settings) => {
      this.settings = settings;
      this.updatePetAppearance();
      this.setupReminders();
      if (this.audioManager) {
        this.audioManager.setVolume(settings.volume / 100);
        this.audioManager.muted = !settings.soundEnabled;
      }
    });

    // 监听延迟提醒
    ipcRenderer.on("delayed-reminder", (event, reminderData) => {
      this.showReminderPopup(reminderData);
    });
  }

  async initWeather() {
    if (this.settings.weatherEnabled) {
      try {
        console.log("初始化天气模块...");
        this.weatherManager = new WeatherManager();
        console.log("天气模块初始化成功");
      } catch (error) {
        console.log("天气模块初始化失败:", error);
      }
    } else {
      console.log("天气功能已禁用");
    }
  }

  setupReminders() {
    // 清除现有的提醒定时器
    Object.values(this.reminderTimers).forEach((timer) => clearInterval(timer));
    this.reminderTimers = {};

    if (!this.settings.reminders) return;

    const reminders = [
      {
        type: "water",
        enabled: this.settings.reminders.water,
        interval: 2 * 60 * 60 * 1000, // 2小时
        title: "喝水提醒",
        message: "该喝水了！保持身体水分充足对健康很重要哦～",
        icon: "💧",
      },
      {
        type: "rest",
        enabled: this.settings.reminders.rest,
        interval: 1 * 60 * 60 * 1000, // 1小时
        title: "休息提醒",
        message: "该休息一下眼睛了！看看远方，让眼睛放松一下吧～",
        icon: "👀",
      },
      {
        type: "stand",
        enabled: this.settings.reminders.stand,
        interval: 45 * 60 * 1000, // 45分钟
        title: "站立提醒",
        message: "该起来活动活动了！久坐对身体不好哦～",
        icon: "🚶‍♂️",
      },
      {
        type: "exercise",
        enabled: this.settings.reminders.exercise,
        interval: 3 * 60 * 60 * 1000, // 3小时
        title: "运动提醒",
        message: "该做些运动了！适当的运动有助于保持健康～",
        icon: "🏃‍♂️",
      },
    ];

    reminders.forEach((reminder) => {
      if (reminder.enabled) {
        this.reminderTimers[reminder.type] = setInterval(() => {
          this.showReminderPopup(reminder);
        }, reminder.interval);
      }
    });
  }

  showReminderPopup(reminderData) {
    // 宠物做提醒动画
    this.playReminderAnimation(reminderData.type);

    // 播放提醒音效
    this.playSound("notification");

    // 显示提醒弹窗
    ipcRenderer.invoke("show-reminder", reminderData);
  }

  playReminderAnimation(type) {
    const petType = this.settings.petType || "cat";

    // 根据提醒类型播放不同动画
    switch (type) {
      case "water":
        this.playHappyAnimation();
        this.showNotification("💧 该喝水啦！");
        break;
      case "rest":
        this.playLookAroundAnimation();
        this.showNotification("👀 休息一下眼睛吧！");
        break;
      case "stand":
        this.playHappyAnimation();
        this.showNotification("🚶‍♂️ 起来活动活动！");
        break;
      case "exercise":
        this.playHappyAnimation();
        this.showNotification("🏃‍♂️ 该运动啦！");
        break;
    }
  }

  onWeatherChange(weatherData) {
    console.log("天气变化:", weatherData);
    this.currentWeather = weatherData;
    this.updateWeatherEffects();
    this.adaptPetToWeather();
  }

  updateWeatherEffects() {
    // 清除现有天气效果
    this.clearWeatherEffects();

    if (!this.currentWeather) return;

    const container = document.getElementById("pet-container");

    switch (this.currentWeather.condition) {
      case "rainy":
        this.createRainEffect(container);
        break;
      case "snowy":
        this.createSnowEffect(container);
        break;
      case "sunny":
        this.createSunEffect(container);
        break;
    }
  }

  createRainEffect(container) {
    for (let i = 0; i < 20; i++) {
      const raindrop = document.createElement("div");
      raindrop.className = "raindrop";
      raindrop.style.cssText = `
                position: absolute;
                width: 2px;
                height: 10px;
                background: linear-gradient(to bottom, transparent, #4fc3f7);
                left: ${Math.random() * 100}%;
                animation: fall ${0.5 + Math.random() * 0.5}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
      container.appendChild(raindrop);
      this.weatherElements.push(raindrop);
    }

    // 添加雨滴动画
    const style = document.createElement("style");
    style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(300px);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(style);
    this.weatherElements.push(style);
  }

  createSnowEffect(container) {
    for (let i = 0; i < 15; i++) {
      const snowflake = document.createElement("div");
      snowflake.className = "snowflake";
      snowflake.textContent = "❄";
      snowflake.style.cssText = `
                position: absolute;
                color: #fff;
                font-size: ${8 + Math.random() * 8}px;
                left: ${Math.random() * 100}%;
                animation: snowfall ${2 + Math.random() * 3}s linear infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
      container.appendChild(snowflake);
      this.weatherElements.push(snowflake);
    }

    const style = document.createElement("style");
    style.textContent = `
            @keyframes snowfall {
                to {
                    transform: translateY(300px) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(style);
    this.weatherElements.push(style);
  }

  createSunEffect(container) {
    const sun = document.createElement("div");
    sun.className = "sun-effect";
    sun.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, #ffd700, #ffed4e);
            border-radius: 50%;
            animation: sun-glow 2s ease-in-out infinite alternate;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        `;
    container.appendChild(sun);
    this.weatherElements.push(sun);

    const style = document.createElement("style");
    style.textContent = `
            @keyframes sun-glow {
                from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
                to { box-shadow: 0 0 30px rgba(255, 215, 0, 0.9); }
            }
        `;
    document.head.appendChild(style);
    this.weatherElements.push(style);
  }

  clearWeatherEffects() {
    this.weatherElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.weatherElements = [];
  }

  adaptPetToWeather() {
    if (!this.currentWeather) return;

    const petType = this.settings.petType || "cat";
    const currentPet = document.getElementById(`${petType}-pet`);
    if (!currentPet) return;

    // 根据天气调整宠物行为
    switch (this.currentWeather.condition) {
      case "rainy":
        // 下雨时宠物可能会躲起来或者显得不太开心
        this.mood = "bored";
        this.showNotification("🌧️ 下雨了，宠物有点不开心");
        break;
      case "sunny":
        // 晴天时宠物更活跃
        this.mood = "happy";
        this.showNotification("☀️ 天气真好，宠物很开心！");
        setTimeout(() => this.playHappyAnimation(), 1000);
        break;
      case "snowy":
        // 下雪时宠物可能会好奇
        this.showNotification("❄️ 下雪了！宠物很好奇");
        break;
    }
  }

  initAudio() {
    try {
      // 简单的音效管理器
      this.audioManager = {
        volume: this.settings.volume / 100,
        muted: !this.settings.soundEnabled,
        context: new (window.AudioContext || window.webkitAudioContext)(),

        playSound: function (type) {
          if (this.muted) return;

          const frequencies = {
            click: 800,
            happy: 600,
            eat: 400,
            sleep: 200,
            notification: 1000,
          };

          const frequency = frequencies[type] || 600;
          const oscillator = this.context.createOscillator();
          const gainNode = this.context.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.context.destination);

          oscillator.frequency.setValueAtTime(
            frequency,
            this.context.currentTime
          );
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0, this.context.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            this.volume * 0.3,
            this.context.currentTime + 0.01
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            this.context.currentTime + 0.2
          );

          oscillator.start(this.context.currentTime);
          oscillator.stop(this.context.currentTime + 0.2);
        },

        setVolume: function (volume) {
          this.volume = Math.max(0, Math.min(1, volume));
        },
      };
    } catch (error) {
      console.log("Audio not supported");
      this.audioManager = { playSound: () => {}, setVolume: () => {} };
    }
  }

  updatePetAppearance() {
    const petType = this.settings.petType || "cat";

    // 隐藏所有宠物 SVG
    document.querySelectorAll(".pet-svg").forEach((svg) => {
      svg.style.display = "none";
    });

    // 显示选中的宠物类型
    const selectedPet = document.getElementById(`${petType}-pet`);
    if (selectedPet) {
      selectedPet.style.display = "block";
    }

    // 更新宠物容器的类名以应用特定动画
    this.pet.className = `pet-idle pet-${petType}`;

    // 根据宠物类型调整特定行为
    this.updatePetBehavior(petType);
  }

  updatePetBehavior(petType) {
    // 根据不同宠物类型设置不同的行为特征
    switch (petType) {
      case "cat":
        this.behaviorTraits = {
          playfulness: 0.8,
          sleepiness: 0.9,
          independence: 0.9,
          sounds: ["meow", "purr"],
        };
        break;
      case "dog":
        this.behaviorTraits = {
          playfulness: 0.95,
          sleepiness: 0.6,
          independence: 0.3,
          sounds: ["woof", "pant"],
        };
        break;
      case "rabbit":
        this.behaviorTraits = {
          playfulness: 0.7,
          sleepiness: 0.7,
          independence: 0.6,
          sounds: ["squeak", "nibble"],
        };
        break;
      case "sheep":
        this.behaviorTraits = {
          playfulness: 0.6,
          sleepiness: 0.8,
          independence: 0.4,
          sounds: ["bleat", "munch"],
        };
        break;
      case "owl":
        this.behaviorTraits = {
          playfulness: 0.5,
          sleepiness: 0.3,
          independence: 0.9,
          sounds: ["hoot", "screech"],
        };
        break;
    }
  }

  playSound(type) {
    if (this.audioManager) {
      this.audioManager.playSound(type);
    }
  }
}

// 初始化宠物
document.addEventListener("DOMContentLoaded", () => {
  new DesktopPet();
});
