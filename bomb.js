(function() {
  
  var bomDefuser = {
    passCode: '',
    armed: 0, // 0 = unarmed, 1 = arming pass, 2 = arming time, 3 = pre-arm, 5 = armed
    keyPress: [],
    time: '', // time
    timer: 0, // time in seconds
    countdown: null, // countdown time in seconds
    flashLight: null,
    lightFlash: false,
    lightColor: 'white',
    
    init: function() {
      // set Events
      this.getKeyPress();
      
      if(this.armed == 0) {
        this.setScreen(1, "UNARMED");
        this.setScreen(2, "NOPE");
      }
    },
    
    setScreen: function(line, data, append) {
      switch(line) {
        case 1:
          screen = document.querySelector('#screen #line1');
          break;
        case 2:
          screen = document.querySelector('#screen #line2');
          break;
      }

      oldData = screen.innerHTML;
      newData = '';
      if(append) {
        newData = oldData +''+data;
      } else {
        newData = data;
      }
      screen.innerHTML = newData;
    },
    
    getKeyPress: function() {
      keys = this.getKeys();
      for (key = 0; key < keys.length; key++) {
        keys[key].addEventListener('click', function() {
          bomDefuser.setKeyPress(this.value);
        }, true);
      }
    },
    
    setKeyPress: function(key) {
      this.keyPress.push(key);
      testString = this.keyPress.join('');
      
      switch(true) {
        // pre-arm bom
        case (
          this.armed === 0
          && testString.lastIndexOf('A***') >= 0
          && testString.lastIndexOf('A***') == (this.keyPress.length - 4)
        ):
          this.setScreen(1, 'SET CODE');
          this.setScreen(2, '');
          this.passcode = '';
          this.armed = 1;
          bomDefuser.doLight('white', true);
          break;
        // give passcode
        case (
          this.armed === 1
          && '*#'.lastIndexOf(key) < 0 // don't include * or #
          && testString.lastIndexOf('#') != (this.keyPress.length - 1)
        ):
          this.passCode += ''+key;
          this.setScreen(2, key, true);
          break;
        // set passcode
        case (
          this.armed === 1
          && testString.lastIndexOf('#') > 0
          && this.passCode.length >= 4
          && this.passCode.length <= 8
          && testString.lastIndexOf('#') == (this.keyPress.length - 1)
        ):
          this.setScreen(1, 'SET TIME')
          this.setScreen(2, '');
          this.armed = 2;
          break;
        // give time
        case (
          this.armed === 2
          && '1234567890'.lastIndexOf(key) > 0 // only include numbers
          && testString.lastIndexOf('#') != (this.keyPress.length - 1)
        ):
          this.time += ''+key;
          this.setScreen(2, key, true);
          break;
        // set time
        case (
          this.armed === 2
          && testString.lastIndexOf('#') > 0
          && this.time.length >= 1
          && this.time.length <= 6
          && testString.lastIndexOf('#') == (this.keyPress.length - 1)
        ):
          this.setScreen(1, 'READY');
          this.setScreen(2, '');
          this.armed = 3;
          break;
        // arming
         case (
          this.armed === 3
          && testString.lastIndexOf('A#') == (this.keyPress.length - 2)
        ):
          this.setScreen(1, 'ARMED');
          this.setScreen(2, '');
          this.armed = 5;
          this.setCountdown();
          this.playSound('clock', true);
          this.doCountdown();
          bomDefuser.doLight('red', true);
          break;
          
        // false passcode
        case (
          this.armed === 5
          && testString.lastIndexOf('#') == (this.keyPress.length - 1)
          && testString.lastIndexOf(this.passCode+"#") != (this.keyPress.length - this.passCode.length - 1)
        ):
          this.playSound('buzzer');
          bomDefuser.timer -= bomDefuser.timer * 0.25;
          
          break;
        // disarm bom
        case (
          this.armed === 5
          && testString.lastIndexOf(this.passCode+"#") > 0
          && testString.lastIndexOf(this.passCode+"#") == (this.keyPress.length - this.passCode.length - 1)
        ):
          clearInterval(bomDefuser.countdown);
          bomDefuser.countdown = false;
         
          this.setScreen(1, 'DISARMED');
          this.setScreen(2, '');
          this.stopSound('clock');
          this.playSound('beep');
          
          clearInterval(bomDefuser.flashLight);
          this.doLight('g');
          
          this.armed = 0;
          break;
        // reset
        case (
          this.armed !== 5
          && testString.lastIndexOf('ABCD#') >= 0
          && testString.lastIndexOf('ABCD#') == (this.keyPress.length - 5)
        ):
          this.armed = 0;
          this.passCode = '';
          this.keyPress = [];
          this.lightFlash = false;
          
          this.setScreen(1, 'UNARMED');
          this.setScreen(2, '');
          
          clearInterval(bomDefuser.flashLight);
          this.doLight('white');
          break;
      }
    },
    
    setCountdown: function() {

      this.timer = 0;
      time = this.time;
      time = time.split("").reverse().join("");
      
      for(var i = 0; i < time.length; i++) {
        switch(i) {
          case 0: this.timer += parseInt(time[i], 10); break;
          case 1: this.timer += (parseInt(time[i], 10) * 10); break;
          case 2: this.timer += (parseInt(time[i], 10) * 60); break;
          case 3: this.timer += (parseInt(time[i], 10) * 60 * 10); break;
          case 4: this.timer += (parseInt(time[i], 10) * 60 * 60); break;
          case 5: this.timer += (parseInt(time[i], 10) * 60 * 60 * 10); break;
        }
      }
    },
    
    doCountdown: function() {
      if(bomDefuser.armed == 5) {
        if(null == bomDefuser.countdown) {
          bomDefuser.countdown = setInterval(bomDefuser.doCountdown, 1000);
        }
        if(bomDefuser.timer < 0) {
          clearInterval(bomDefuser.countdown);
          // blow up!!!
          bomDefuser.setScreen(1, "BOOM!");
          bomDefuser.setScreen(2, "");
          bomDefuser.stopSound('clock');
          bomDefuser.playSound('explosion');
          bomDefuser.armed = 0;
          return;
        } else {
          count = bomDefuser.updateTime(bomDefuser.timer);
          bomDefuser.setScreen(2, count);
          bomDefuser.timer--;
        }
      }
    },
    
    doLight: function(color, flash) {
      light = document.getElementById('light');
      
      if(flash || bomDefuser.lightFlash) {
        bomDefuser.lightColor = color || bomDefuser.lightColor;
        bomDefuser.lightFlash = flash || bomDefuser.lightFlash;
        
        if(null == bomDefuser.flashLight) {
          bomDefuser.flashLight = setInterval(bomDefuser.doLight, 500);
        }
        if(light.style.background == bomDefuser.lightColor) {
          light.style.background = 'black';
        } else {
          light.style.background = bomDefuser.lightColor;
        }
      } else {
        clearInterval(bomDefuser.flashLight);
        light.style.background = color;
      }
    },
    
    playSound: function(id, loop) {
      myAudio = document.getElementById(id);
      if(true == loop) {
        myAudio.addEventListener('ended', function() {
          this.currentTime = 0;
          this.play();
        }, false);
      }
      myAudio.play();
    },
    stopSound: function(id) {
      myAudio = document.getElementById(id);
      myAudio.pause();
      myAudio.currentTime = 0;
    },
    
    getKeys: function() {
      return document.querySelectorAll('#keypad button');
    },
    
    updateTime: function(time) {
      var sec_num = parseInt(time, 10);
      var hours   = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
      var seconds = sec_num - (hours * 3600) - (minutes * 60);

      if (hours   < 10) {hours   = "0"+hours;}
      if (minutes < 10) {minutes = "0"+minutes;}
      if (seconds < 10) {seconds = "0"+seconds;}
      var time    = hours+':'+minutes+':'+seconds;
      return time;
    }
  };
  
  bomDefuser.init();
})();
