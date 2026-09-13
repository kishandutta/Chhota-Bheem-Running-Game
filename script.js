(function() {
  'use strict';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
  const basePixelRatio = isMobile ? Math.min(window.devicePixelRatio || 1, 1.25) : Math.min(window.devicePixelRatio || 1, 1.75);

  const CONFIG = {
    LANE_WIDTH: 2.7,
    LANES: [-2.7, 0, 2.7],
    BASE_SPEED: 14.0,
    MAX_SPEED_CAP: 20.0,
    JUMP_VELOCITY: 14.5,
    GRAVITY: -38.0,
    SLIDE_DURATION: 0.85,
    CHUNK_LENGTH: 45.0,
    NUM_CHUNKS: 6,
    MAGNET_DURATION: 9.0,
    BOOST_DURATION: 7.0,
    MAGNET_RADIUS: 14.0,
    FOV_NORMAL: 60,
    FOV_BOOST: 78
  };

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.masterGain = null;
      this.bgmGain = null;
      this.isBgmPlaying = false;
      this.schedulerTimer = null;
      this.currentStep = 0;
      this.stepDuration = 0.357;
      this.nextNoteTime = 0;
    }

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.startBGM();
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.ctx && !this.isBgmPlaying) {
        this.startBGM();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.enabled ? 0.7 : 0.0, this.ctx.currentTime);
      }
      return this.enabled;
    }

    playFootstep() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    playJump() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    }

    playSlide() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.Q.setValueAtTime(2.5, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(t);
    }

    playLadduCollect(pitchMultiplier = 1.0) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.00, 1046.50, 1174.66];
      const baseFreq = notes[Math.floor(Math.random() * notes.length)] * pitchMultiplier;

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, t);
      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.36);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2.0, t);
      gain2.gain.setValueAtTime(0.18, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.29);
    }

    playPowerUp() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);
        gain.gain.setValueAtTime(0.28, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.26);
      });
    }

    playSmash() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.41);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.4, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);
      noise.start(t);
    }

    playCrash() {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.56);
    }

    startBGM() {
      if (!this.ctx || this.isBgmPlaying) return;
      this.isBgmPlaying = true;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.currentStep = 0;
      this.stepDuration = 0.357;
      this.nextNoteTime = this.ctx.currentTime + 0.1;

      if (this.schedulerTimer) clearInterval(this.schedulerTimer);
      this.schedulerTimer = setInterval(() => {
        this.scheduleBGM();
      }, 50);
    }

    startForestAmbience() {
      this.startBGM();
    }

    stopBGM() {
      this.isBgmPlaying = false;
      if (this.schedulerTimer) {
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      }
    }

    duckBGM(duck = true) {
      if (!this.bgmGain || !this.ctx) return;
      const targetVol = duck ? 0.08 : 0.24;
      this.bgmGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.2);
    }

    scheduleBGM() {
      if (!this.ctx || !this.isBgmPlaying || !this.enabled) return;
      const scheduleAhead = 0.22;
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAhead) {
        this.playBgmStep(this.currentStep, this.nextNoteTime);
        this.nextNoteTime += this.stepDuration;
        this.currentStep = (this.currentStep + 1) % 64;
      }
    }

    playBgmStep(step, time) {
      const marimbaNotes = [
        293.66, 369.99, 440.00, 369.99, 587.33, 440.00, 369.99, 440.00,
        392.00, 493.88, 587.33, 493.88, 659.25, 587.33, 493.88, 587.33,
        369.99, 440.00, 587.33, 739.99, 587.33, 440.00, 369.99, 440.00,
        329.63, 440.00, 554.37, 659.25, 440.00, 369.99, 329.63, 369.99,
        293.66, 440.00, 369.99, 440.00, 587.33, 659.25, 739.99, 587.33,
        392.00, 493.88, 587.33, 493.88, 587.33, 783.99, 739.99, 587.33,
        246.94, 293.66, 369.99, 440.00, 493.88, 587.33, 493.88, 440.00,
        220.00, 277.18, 329.63, 392.00, 440.00, 369.99, 329.63, 277.18
      ];

      const mFreq = marimbaNotes[step];
      if (mFreq) {
        const vel = (step % 2 === 0 ? 0.095 : 0.075);
        this.playMarimba(mFreq, time, this.stepDuration * 0.92, vel);
      }

      const padChords = {
        0:  [146.83, 220.00, 369.99],
        8:  [98.00,  146.83, 246.94],
        16: [123.47, 185.00, 293.66],
        24: [110.00, 164.81, 277.18],
        32: [146.83, 220.00, 369.99],
        40: [98.00,  146.83, 246.94],
        48: [123.47, 185.00, 293.66],
        56: [110.00, 164.81, 196.00]
      };

      if (padChords[step]) {
        this.playPadChord(padChords[step], time, this.stepDuration * 8.0, 0.032);
      }

      const fluteMelody = {
        0:  [587.33, 1.9, 0.085],
        2:  [739.99, 1.9, 0.088],
        4:  [659.25, 1.7, 0.082],
        6:  [587.33, 1.9, 0.085],
        8:  [493.88, 1.9, 0.080],
        10: [587.33, 1.9, 0.085],
        12: [659.25, 3.2, 0.090],
        16: [739.99, 1.9, 0.090],
        18: [880.00, 1.9, 0.094],
        20: [739.99, 1.9, 0.088],
        22: [587.33, 1.9, 0.084],
        24: [659.25, 2.4, 0.084],
        27: [739.99, 0.9, 0.080],
        28: [659.25, 1.9, 0.080],
        30: [587.33, 1.9, 0.086],
        32: [880.00, 1.7, 0.090],
        34: [739.99, 1.7, 0.086],
        36: [587.33, 1.9, 0.084],
        38: [659.25, 1.9, 0.085],
        40: [587.33, 1.7, 0.084],
        42: [659.25, 1.7, 0.086],
        44: [783.99, 1.9, 0.092],
        46: [739.99, 1.9, 0.088],
        48: [659.25, 1.7, 0.084],
        50: [587.33, 1.7, 0.084],
        52: [493.88, 1.9, 0.080],
        54: [440.00, 1.9, 0.078],
        56: [493.88, 1.7, 0.080],
        58: [440.00, 1.7, 0.078],
        60: [659.25, 1.9, 0.084],
        62: [587.33, 1.9, 0.088]
      };

      if (fluteMelody[step]) {
        const [freq, stepSpan, vel] = fluteMelody[step];
        this.playBambooFlute(freq, time, stepSpan * this.stepDuration, vel);
      }
    }

    playMarimba(freq, time, duration = 0.32, velocity = 0.09) {
      if (!this.enabled || !this.ctx || !this.bgmGain) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2100, time);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, time);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.0, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(velocity, time + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);
      filter.connect(this.bgmGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration + 0.05);
      osc2.stop(time + duration + 0.05);
    }

    playBambooFlute(freq, time, duration = 0.65, velocity = 0.085) {
      if (!this.enabled || !this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const triOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.Q.setValueAtTime(1.5, time);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4.6, time);
      lfoGain.gain.setValueAtTime(0.0001, time);
      lfoGain.gain.setValueAtTime(0.0001, time + 0.10);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.012, time + 0.35);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfoGain.connect(triOsc.frequency);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      triOsc.type = 'triangle';
      triOsc.frequency.setValueAtTime(freq, time);

      const triGain = this.ctx.createGain();
      triGain.gain.setValueAtTime(0.20, time);
      triOsc.connect(triGain);

      const attack = 0.06;
      const release = 0.15;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(velocity, time + attack);
      gain.gain.setValueAtTime(velocity * 0.88, time + duration - release);
      gain.gain.linearRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      triGain.connect(gain);
      gain.connect(filter);
      filter.connect(this.bgmGain);

      osc.start(time);
      triOsc.start(time);
      lfo.start(time);

      const stopTime = time + duration + 0.05;
      osc.stop(stopTime);
      triOsc.stop(stopTime);
      lfo.stop(stopTime);
    }

    playPadChord(freqs, time, duration = 2.8, velocity = 0.032) {
      if (!this.enabled || !this.ctx || !this.bgmGain) return;
      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, time);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        const attack = 0.45;
        const release = 0.65;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(velocity, time + attack);
        gain.gain.setValueAtTime(velocity * 0.88, time + duration - release);
        gain.gain.linearRampToValueAtTime(0.0001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + duration + 0.1);
      });
    }
  }

  let cachedChhotaBheemFaceTexture = null;
  function createChhotaBheemFaceTexture() {
    if (cachedChhotaBheemFaceTexture) return cachedChhotaBheemFaceTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    const baseGrad = ctx.createRadialGradient(256, 265, 120, 256, 265, 240);
    baseGrad.addColorStop(0, '#F4AB84');
    baseGrad.addColorStop(0.72, '#F0A37A');
    baseGrad.addColorStop(1.0, 'rgba(240, 163, 122, 0)');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(256, 265, 240, 0, Math.PI * 2);
    ctx.fill();

    const drawBlush = (cx, cy) => {
      const bGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 58);
      bGrad.addColorStop(0, 'rgba(240, 95, 85, 0.42)');
      bGrad.addColorStop(0.55, 'rgba(240, 110, 100, 0.22)');
      bGrad.addColorStop(1, 'rgba(240, 110, 100, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fill();
    };
    drawBlush(160, 302);
    drawBlush(352, 302);

    ctx.save();
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.arc(256, 152, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8E0000';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(256, 172, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#3E1C12';
    ctx.beginPath();
    ctx.moveTo(170, 198);
    ctx.quadraticCurveTo(210, 172, 240, 190);
    ctx.quadraticCurveTo(210, 180, 170, 198);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(342, 198);
    ctx.quadraticCurveTo(302, 172, 272, 190);
    ctx.quadraticCurveTo(302, 180, 342, 198);
    ctx.fill();
    ctx.restore();

    const drawEye = (centerX, centerY, isRight = false) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(120, 60, 40, 0.45)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const creaseOffset = isRight ? -4 : 4;
      ctx.moveTo(centerX - 30 + creaseOffset, centerY - 40);
      ctx.quadraticCurveTo(centerX + creaseOffset, centerY - 48, centerX + 30 + creaseOffset, centerY - 40);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 31, 38, isRight ? -0.06 : 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      const eyeShadowGrad = ctx.createLinearGradient(centerX, centerY - 38, centerX, centerY - 10);
      eyeShadowGrad.addColorStop(0, 'rgba(180, 160, 160, 0.28)');
      eyeShadowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = eyeShadowGrad;
      ctx.fill();

      ctx.clip();

      const irisX = isRight ? centerX - 3 : centerX + 3;
      const irisY = centerY + 2;
      const irisR = 24;
      const irisGrad = ctx.createRadialGradient(irisX, irisY, 5, irisX, irisY, irisR);
      irisGrad.addColorStop(0, '#5C2D1C');
      irisGrad.addColorStop(0.7, '#3E1C12');
      irisGrad.addColorStop(1, '#24100A');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(irisX, irisY, irisR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#110A07';
      ctx.beginPath();
      ctx.arc(irisX, irisY, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(irisX - 7, irisY - 7, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(irisX + 7, irisY + 7, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#24100A';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 31, 38, isRight ? -0.06 : 0.06, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 31, 38, isRight ? -0.06 : 0.06, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.restore();
    };

    drawEye(185, 238, false);
    drawEye(327, 238, true);

    ctx.save();
    ctx.strokeStyle = '#9C5338';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(248, 280);
    ctx.quadraticCurveTo(256, 289, 264, 280);
    ctx.stroke();

    ctx.fillStyle = 'rgba(156, 83, 56, 0.4)';
    ctx.beginPath();
    ctx.arc(247, 282, 2, 0, Math.PI * 2);
    ctx.arc(265, 282, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#35160D';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(202, 325);
    ctx.bezierCurveTo(225, 358, 287, 358, 310, 325);
    ctx.stroke();

    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(200, 328);
    ctx.quadraticCurveTo(203, 323, 207, 323);
    ctx.moveTo(312, 328);
    ctx.quadraticCurveTo(310, 323, 305, 323);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(215, 95, 80, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(240, 363);
    ctx.quadraticCurveTo(256, 368, 272, 363);
    ctx.stroke();
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    cachedChhotaBheemFaceTexture = texture;
    return texture;
  }

  function createChhotaBheemCharacter() {
    const root = new THREE.Group();
    root.name = 'ChhotaBheem';

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xF0A882 });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x441E15 });
    const dhotiMat = new THREE.MeshLambertMaterial({ color: 0xFF6A00 });
    const dhotiPleatMat = new THREE.MeshLambertMaterial({ color: 0xE65500 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xFFB300, emissive: 0x332200 });
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x8A3324 });

    const faceTexture = createChhotaBheemFaceTexture();
    const faceMat = new THREE.MeshLambertMaterial({
      map: faceTexture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const cordMat = new THREE.MeshLambertMaterial({ color: 0x241A15 });

    const bodyPivot = new THREE.Group();
    bodyPivot.position.y = 1.05;
    root.add(bodyPivot);

    const pelvis = new THREE.Group();
    bodyPivot.add(pelvis);

    const dhotiGeo = new THREE.CylinderGeometry(0.42, 0.56, 0.76, 14);
    const dhotiMesh = new THREE.Mesh(dhotiGeo, dhotiMat);
    dhotiMesh.position.y = -0.22;
    pelvis.add(dhotiMesh);

    const waistRimGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.08, 14);
    const waistRim = new THREE.Mesh(waistRimGeo, dhotiPleatMat);
    waistRim.position.y = 0.14;
    pelvis.add(waistRim);

    const pleatGroup = new THREE.Group();
    pleatGroup.position.set(0, -0.22, -0.48);
    pelvis.add(pleatGroup);

    for (let p = -1; p <= 1; p++) {
      const pleatGeo = new THREE.BoxGeometry(0.08, 0.74, 0.06);
      const pleatMesh = new THREE.Mesh(pleatGeo, p === 0 ? dhotiMat : dhotiPleatMat);
      pleatMesh.position.set(p * 0.085, 0, (1 - Math.abs(p)) * 0.02);
      pleatGroup.add(pleatMesh);
    }

    const torso = new THREE.Group();
    torso.position.y = 0.20;
    pelvis.add(torso);

    const torsoGeo = new THREE.CylinderGeometry(0.50, 0.38, 0.65, 14);
    const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
    torsoMesh.position.y = 0.32;
    torso.add(torsoMesh);

    const pecGeo = new THREE.SphereGeometry(0.20, 10, 8);
    pecGeo.scale(1.1, 0.85, 0.6);
    const leftPec = new THREE.Mesh(pecGeo, skinMat);
    leftPec.position.set(-0.16, 0.44, -0.22);
    torso.add(leftPec);

    const rightPec = leftPec.clone();
    rightPec.position.x = 0.16;
    torso.add(rightPec);

    const backScapGeo = new THREE.SphereGeometry(0.18, 10, 8);
    backScapGeo.scale(1.0, 1.2, 0.5);
    const leftScap = new THREE.Mesh(backScapGeo, skinMat);
    leftScap.position.set(-0.18, 0.42, 0.20);
    torso.add(leftScap);

    const rightScap = leftScap.clone();
    rightScap.position.x = 0.18;
    torso.add(rightScap);

    const neckCordGeo = new THREE.TorusGeometry(0.32, 0.022, 6, 16);
    const neckCord = new THREE.Mesh(neckCordGeo, cordMat);
    neckCord.rotation.x = Math.PI / 2.15;
    neckCord.position.set(0, 0.58, 0);
    torso.add(neckCord);

    const locketGeo = new THREE.BoxGeometry(0.15, 0.12, 0.04);
    const locket = new THREE.Mesh(locketGeo, goldMat);
    locket.position.set(0, 0.38, -0.32);
    torso.add(locket);

    const neckGeo = new THREE.CylinderGeometry(0.20, 0.24, 0.18, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.70;
    torso.add(neckMesh);

    const headGroup = new THREE.Group();
    headGroup.position.y = 0.94;
    torso.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.39, 18, 14);
    headGeo.scale(1.0, 1.05, 1.0);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headGroup.add(headMesh);

    const cheekGeo = new THREE.SphereGeometry(0.16, 10, 8);
    cheekGeo.scale(1.0, 0.88, 0.95);
    const leftCheek = new THREE.Mesh(cheekGeo, skinMat);
    leftCheek.position.set(-0.24, -0.06, -0.18);
    headGroup.add(leftCheek);

    const rightCheek = leftCheek.clone();
    rightCheek.position.x = 0.24;
    headGroup.add(rightCheek);

    const earGeo = new THREE.SphereGeometry(0.09, 8, 6);
    earGeo.scale(0.5, 1.1, 0.85);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.38, 0.0, -0.04);
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = 0.38;
    headGroup.add(rightEar);

    const facePlateGeo = new THREE.PlaneGeometry(0.70, 0.70, 10, 10);
    const pos = facePlateGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distSq = x * x + y * y;
      const rSq = 0.395 * 0.395;
      const zCurve = distSq < rSq ? -(0.395 - Math.sqrt(rSq - distSq)) : -0.16;
      pos.setZ(i, zCurve);
    }
    facePlateGeo.computeVertexNormals();

    const facePlate = new THREE.Mesh(facePlateGeo, faceMat);
    facePlate.position.set(0, 0.01, -0.388);
    facePlate.rotation.y = Math.PI;
    headGroup.add(facePlate);

    const noseGeo = new THREE.SphereGeometry(0.038, 8, 6);
    noseGeo.scale(1.0, 0.75, 0.7);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.05, -0.395);
    headGroup.add(noseMesh);

    const hairDomeGeo = new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const hairDome = new THREE.Mesh(hairDomeGeo, hairMat);
    hairDome.position.set(0, 0.08, 0.04);
    headGroup.add(hairDome);

    const occipitalGeo = new THREE.SphereGeometry(0.40, 14, 10);
    occipitalGeo.scale(1.04, 1.0, 1.15);
    const occipital = new THREE.Mesh(occipitalGeo, hairMat);
    occipital.position.set(0, 0.06, 0.12);
    headGroup.add(occipital);

    const sideburnGeo = new THREE.BoxGeometry(0.08, 0.22, 0.12);
    const leftSideburn = new THREE.Mesh(sideburnGeo, hairMat);
    leftSideburn.position.set(-0.38, -0.05, -0.08);
    headGroup.add(leftSideburn);

    const rightSideburn = leftSideburn.clone();
    rightSideburn.position.x = 0.38;
    headGroup.add(rightSideburn);

    const hairCrestGeo = new THREE.SphereGeometry(0.26, 12, 8);
    hairCrestGeo.scale(1.5, 0.65, 0.85);
    const hairCrest = new THREE.Mesh(hairCrestGeo, hairMat);
    hairCrest.position.set(0, 0.32, -0.16);
    hairCrest.rotation.x = -0.35;
    headGroup.add(hairCrest);

    const napeFlickGroup = new THREE.Group();
    napeFlickGroup.position.set(0, -0.04, 0.36);
    headGroup.add(napeFlickGroup);

    const flickGeo = new THREE.ConeGeometry(0.18, 0.32, 10);
    const flickMesh = new THREE.Mesh(flickGeo, hairMat);
    flickMesh.rotation.x = Math.PI / 2.8;
    flickMesh.position.set(0, 0.04, 0.08);
    napeFlickGroup.add(flickMesh);

    const flickTipGeo = new THREE.SphereGeometry(0.10, 8, 6);
    const flickTip = new THREE.Mesh(flickTipGeo, hairMat);
    flickTip.position.set(0, 0.12, 0.20);
    napeFlickGroup.add(flickTip);

    function createArm(isLeft) {
      const armGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      armGroup.position.set(sign * 0.54, 0.50, 0);

      const shoulderGeo = new THREE.SphereGeometry(0.18, 10, 8);
      const shoulder = new THREE.Mesh(shoulderGeo, skinMat);
      armGroup.add(shoulder);

      const upperArmGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.42, 10);
      const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
      upperArm.position.y = -0.21;
      armGroup.add(upperArm);

      const forearmGroup = new THREE.Group();
      forearmGroup.position.y = -0.42;
      armGroup.add(forearmGroup);

      const forearmGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.38, 10);
      const forearm = new THREE.Mesh(forearmGeo, skinMat);
      forearm.position.y = -0.17;
      forearmGroup.add(forearm);

      const wristbandGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.09, 10);
      const wristband = new THREE.Mesh(wristbandGeo, goldMat);
      wristband.position.y = -0.28;
      forearmGroup.add(wristband);

      const fistGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const fist = new THREE.Mesh(fistGeo, skinMat);
      fist.position.y = -0.39;
      forearmGroup.add(fist);

      return { root: armGroup, forearm: forearmGroup };
    }

    const leftArm = createArm(true);
    torso.add(leftArm.root);

    const rightArm = createArm(false);
    torso.add(rightArm.root);

    function createLeg(isLeft) {
      const legGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;
      legGroup.position.set(sign * 0.22, -0.46, 0);

      const calfGeo = new THREE.CylinderGeometry(0.14, 0.11, 0.38, 10);
      const calf = new THREE.Mesh(calfGeo, skinMat);
      calf.position.y = -0.18;
      legGroup.add(calf);

      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.38, 0);
      legGroup.add(shoeGroup);

      const shoeBaseGeo = new THREE.BoxGeometry(0.18, 0.14, 0.32);
      const shoeBase = new THREE.Mesh(shoeBaseGeo, shoeMat);
      shoeBase.position.set(0, 0, -0.05);
      shoeGroup.add(shoeBase);

      const toeCapGeo = new THREE.SphereGeometry(0.11, 8, 6);
      toeCapGeo.scale(1.0, 0.7, 1.2);
      const toeCap = new THREE.Mesh(toeCapGeo, shoeMat);
      toeCap.position.set(0, -0.02, -0.20);
      shoeGroup.add(toeCap);

      return { root: legGroup, calf, shoe: shoeGroup };
    }

    const leftLeg = createLeg(true);
    pelvis.add(leftLeg.root);

    const rightLeg = createLeg(false);
    pelvis.add(rightLeg.root);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 58);
    sGrad.addColorStop(0, 'rgba(8, 14, 10, 0.7)');
    sGrad.addColorStop(0.5, 'rgba(8, 14, 10, 0.35)');
    sGrad.addColorStop(1, 'rgba(8, 14, 10, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.beginPath();
    sCtx.arc(64, 64, 58, 0, Math.PI * 2);
    sCtx.fill();

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.1);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.03;
    root.add(shadowMesh);

    const auraGeo = new THREE.TorusGeometry(0.95, 0.05, 6, 20);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });
    const auraRing = new THREE.Mesh(auraGeo, auraMat);
    auraRing.rotation.x = Math.PI / 2;
    auraRing.position.y = 1.0;
    root.add(auraRing);

    let runAnimTime = 0;

    return {
      root,
      bodyPivot,
      pelvis,
      torso,
      head: headGroup,
      napeFlick: napeFlickGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      shadowMesh,
      shadowMat,
      auraRing,
      auraMat,

      updateAnimation: function(isJumping, isSliding, isGameOver, delta, runSpeed, playerY) {
        auraRing.rotation.z += delta * 4.0;

        shadowMesh.position.y = 0.03 - playerY;
        const jumpH = Math.max(0, playerY);
        shadowMesh.scale.setScalar(1.0 + jumpH * 0.2);
        shadowMat.opacity = Math.max(0.08, 0.55 / (1.0 + jumpH * 0.85));

        if (isGameOver) {
          torso.rotation.x = -0.55;
          headGroup.rotation.x = 0.35;
          leftArm.root.rotation.x = 1.1;
          rightArm.root.rotation.x = 1.1;
          leftLeg.root.rotation.x = -0.4;
          rightLeg.root.rotation.x = -0.5;
          napeFlickGroup.rotation.x = -0.4;
          return;
        }

        if (isJumping) {
          bodyPivot.position.y = 1.05;
          torso.rotation.x = 0.18;
          headGroup.rotation.x = -0.12;
          headGroup.position.y = 0.94;

          leftLeg.root.rotation.x = -0.75;
          rightLeg.root.rotation.x = -0.45;

          leftArm.root.rotation.x = -1.75;
          leftArm.forearm.rotation.x = -0.4;
          rightArm.root.rotation.x = -1.75;
          rightArm.forearm.rotation.x = -0.4;

          napeFlickGroup.rotation.x = 0.35;
        } else if (isSliding) {
          bodyPivot.position.y = 0.38;
          torso.rotation.x = -0.95;
          headGroup.rotation.x = 0.75;

          leftLeg.root.rotation.x = -1.35;
          rightLeg.root.rotation.x = -1.15;

          leftArm.root.rotation.x = 0.65;
          rightArm.root.rotation.x = 0.65;

          napeFlickGroup.rotation.x = -0.35;
        } else {
          bodyPivot.position.y = 1.05;
          runAnimTime += delta * (runSpeed * 0.42);
          const cycle = runAnimTime;

          torso.rotation.x = 0.15;
          torso.rotation.y = Math.sin(cycle) * 0.10;
          headGroup.rotation.y = -Math.sin(cycle) * 0.08;
          headGroup.rotation.x = -0.04;
          headGroup.position.y = 0.94 + Math.abs(Math.sin(cycle * 2.0)) * 0.05;

          napeFlickGroup.rotation.x = Math.sin(cycle * 2.0) * 0.15;

          const armAngle = Math.sin(cycle) * 0.82;
          leftArm.root.rotation.x = armAngle;
          leftArm.forearm.rotation.x = -0.35 - Math.max(0, armAngle * 0.5);
          rightArm.root.rotation.x = -armAngle;
          rightArm.forearm.rotation.x = -0.35 - Math.max(0, -armAngle * 0.5);

          const legAngle = Math.sin(cycle) * 0.88;
          leftLeg.root.rotation.x = -legAngle;
          rightLeg.root.rotation.x = legAngle;
        }
      }
    };
  }

  const SHARED_RES = {
    ladduGeo: new THREE.DodecahedronGeometry(0.48, 1),
    ladduMat: new THREE.MeshLambertMaterial({
      color: 0xFFA000,
      emissive: 0x773300
    }),
    haloGeo: new THREE.TorusGeometry(0.68, 0.03, 4, 16),
    haloMat: new THREE.MeshBasicMaterial({
      color: 0xFFE082,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    }),

    horseshoeGeo: new THREE.TorusGeometry(0.55, 0.12, 6, 16, Math.PI),
    horseshoeMat: new THREE.MeshLambertMaterial({
      color: 0x00B0FF,
      emissive: 0x004488
    }),
    magnetPoleGeo: new THREE.BoxGeometry(0.24, 0.28, 0.24),
    silverMat: new THREE.MeshLambertMaterial({ color: 0xDDDDDD }),

    boostCoreGeo: new THREE.IcosahedronGeometry(0.6, 1),
    boostCoreMat: new THREE.MeshLambertMaterial({
      color: 0xFF3D00,
      emissive: 0x771100
    }),
    boostOrbitGeo: new THREE.TorusGeometry(0.85, 0.04, 4, 16),
    boostOrbitMat: new THREE.MeshBasicMaterial({ color: 0xFFFF00, wireframe: true }),

    logGeo: new THREE.CylinderGeometry(0.42, 0.46, 2.4, 10),
    logMat: new THREE.MeshLambertMaterial({ color: 0x4E3629 }),
    mossGeo: new THREE.BoxGeometry(1.6, 0.15, 0.6),
    mossMat: new THREE.MeshLambertMaterial({ color: 0x2E7D32 }),

    trunkMat: new THREE.MeshLambertMaterial({ color: 0x3E2723 }),
    branchPostGeo: new THREE.CylinderGeometry(0.25, 0.3, 3.2, 8),
    branchBeamGeo: new THREE.CylinderGeometry(0.35, 0.32, 3.0, 8),
    vineMat: new THREE.MeshLambertMaterial({ color: 0x1B5E20 }),
    vineGeo: new THREE.CylinderGeometry(0.04, 0.02, 1.1, 4),

    rockGeo: new THREE.DodecahedronGeometry(1.05, 0),
    rockMat: new THREE.MeshLambertMaterial({ color: 0x616161 }),
    runeGeo: new THREE.BoxGeometry(0.4, 0.6, 0.04),
    runeMat: new THREE.MeshBasicMaterial({ color: 0xFFB300 }),

    pathGeo: new THREE.PlaneGeometry(CONFIG.LANE_WIDTH * 3.6, CONFIG.CHUNK_LENGTH),
    pathMat: new THREE.MeshLambertMaterial({ color: 0x5C4033 }),
    curbGeo: new THREE.BoxGeometry(0.35, 0.25, CONFIG.CHUNK_LENGTH),
    curbMat: new THREE.MeshLambertMaterial({ color: 0x8D6E63 }),
    forestSideGeo: new THREE.PlaneGeometry(28, CONFIG.CHUNK_LENGTH),
    forestSideMat: new THREE.MeshLambertMaterial({ color: 0x0E2419 }),

    treeTrunkGeo: new THREE.CylinderGeometry(0.8, 1.4, 8, 8),
    treeRootGeo: new THREE.CylinderGeometry(0.18, 0.28, 5, 5),
    leafMat: new THREE.MeshLambertMaterial({ color: 0x1B4332 }),
    treeCanopy1Geo: new THREE.DodecahedronGeometry(3.5, 0),
    treeCanopy2Geo: new THREE.DodecahedronGeometry(2.6, 0),

    torchPoleGeo: new THREE.CylinderGeometry(0.12, 0.14, 3.2, 6),
    torchPoleMat: new THREE.MeshLambertMaterial({ color: 0x2D1B11 }),
    torchBowlGeo: new THREE.CylinderGeometry(0.3, 0.15, 0.35, 6),
    torchGoldMat: new THREE.MeshLambertMaterial({ color: 0xB8860B }),
    torchFlameGeo: new THREE.ConeGeometry(0.2, 0.5, 6),
    torchFlameMat: new THREE.MeshBasicMaterial({ color: 0xFF6F00 }),

    debrisGeo: new THREE.DodecahedronGeometry(0.3, 0),
    debrisMat: new THREE.MeshLambertMaterial({ color: 0x8D6E63 })
  };

  function createLadduMesh() {
    const group = new THREE.Group();
    group.name = 'Laddu';

    const sphere = new THREE.Mesh(SHARED_RES.ladduGeo, SHARED_RES.ladduMat);
    group.add(sphere);

    const halo = new THREE.Mesh(SHARED_RES.haloGeo, SHARED_RES.haloMat);
    halo.rotation.x = Math.PI / 3;
    group.add(halo);

    group.userData = { type: 'laddu', sphere, halo, rotSpeed: 2.2 };
    return group;
  }

  function createMagnetMesh() {
    const group = new THREE.Group();
    group.name = 'MagnetPowerup';

    const horseshoe = new THREE.Mesh(SHARED_RES.horseshoeGeo, SHARED_RES.horseshoeMat);
    horseshoe.rotation.z = Math.PI;
    group.add(horseshoe);

    const p1 = new THREE.Mesh(SHARED_RES.magnetPoleGeo, SHARED_RES.silverMat);
    p1.position.set(-0.55, 0.14, 0);
    group.add(p1);
    const p2 = p1.clone();
    p2.position.x = 0.55;
    group.add(p2);

    group.userData = { type: 'magnet', rotSpeed: 3.0 };
    return group;
  }

  function createBoostMesh() {
    const group = new THREE.Group();
    group.name = 'BoostPowerup';

    const core = new THREE.Mesh(SHARED_RES.boostCoreGeo, SHARED_RES.boostCoreMat);
    group.add(core);

    const orbit = new THREE.Mesh(SHARED_RES.boostOrbitGeo, SHARED_RES.boostOrbitMat);
    group.add(orbit);

    group.userData = { type: 'boost', core, orbit, rotSpeed: 4.0 };
    return group;
  }

  function createLogObstacle() {
    const group = new THREE.Group();
    group.name = 'ObstacleLog';

    const logMesh = new THREE.Mesh(SHARED_RES.logGeo, SHARED_RES.logMat);
    logMesh.rotation.z = Math.PI / 2;
    logMesh.position.y = 0.42;
    group.add(logMesh);

    const moss = new THREE.Mesh(SHARED_RES.mossGeo, SHARED_RES.mossMat);
    moss.position.set(0, 0.84, 0);
    group.add(moss);

    group.userData = {
      type: 'jump_hurdle',
      height: 0.9,
      width: 2.2,
      depth: 0.9,
      hitYMin: 0.0,
      hitYMax: 0.9
    };
    return group;
  }

  function createBranchObstacle() {
    const group = new THREE.Group();
    group.name = 'ObstacleBranch';

    const leftPost = new THREE.Mesh(SHARED_RES.branchPostGeo, SHARED_RES.trunkMat);
    leftPost.position.set(-1.3, 1.6, 0);
    group.add(leftPost);

    const rightPost = leftPost.clone();
    rightPost.position.x = 1.3;
    group.add(rightPost);

    const beam = new THREE.Mesh(SHARED_RES.branchBeamGeo, SHARED_RES.trunkMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(0, 2.3, 0);
    group.add(beam);

    for (let i = -1; i <= 1; i += 0.5) {
      const vine = new THREE.Mesh(SHARED_RES.vineGeo, SHARED_RES.vineMat);
      vine.position.set(i * 0.9, 1.7, 0.1);
      group.add(vine);
    }

    group.userData = {
      type: 'slide_hurdle',
      height: 2.6,
      width: 2.4,
      depth: 0.8,
      hitYMin: 1.1,
      hitYMax: 2.6
    };
    return group;
  }

  function createBoulderObstacle() {
    const group = new THREE.Group();
    group.name = 'ObstacleBoulder';

    const rock = new THREE.Mesh(SHARED_RES.rockGeo, SHARED_RES.rockMat);
    rock.scale.set(0.9, 1.3, 0.9);
    rock.position.y = 1.1;
    group.add(rock);

    const rune = new THREE.Mesh(SHARED_RES.runeGeo, SHARED_RES.runeMat);
    rune.position.set(0, 1.2, 0.92);
    group.add(rune);

    group.userData = {
      type: 'block_hurdle',
      height: 2.4,
      width: 1.8,
      depth: 1.8,
      hitYMin: 0.0,
      hitYMax: 2.4
    };
    return group;
  }

  function createBanyanTree() {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(SHARED_RES.treeTrunkGeo, SHARED_RES.trunkMat);
    trunk.position.y = 4;
    group.add(trunk);

    for (let r = 0; r < 4; r++) {
      const rootMesh = new THREE.Mesh(SHARED_RES.treeRootGeo, SHARED_RES.trunkMat);
      const angle = (r / 4) * Math.PI * 2;
      rootMesh.position.set(Math.cos(angle) * 1.5, 2.5, Math.sin(angle) * 1.5);
      rootMesh.rotation.z = (Math.random() - 0.5) * 0.3;
      group.add(rootMesh);
    }

    const canopy1 = new THREE.Mesh(SHARED_RES.treeCanopy1Geo, SHARED_RES.leafMat);
    canopy1.position.set(0, 8.5, 0);
    group.add(canopy1);

    const canopy2 = new THREE.Mesh(SHARED_RES.treeCanopy2Geo, SHARED_RES.leafMat);
    canopy2.position.set(1.4, 9.8, -0.8);
    group.add(canopy2);

    return group;
  }

  function createTorch() {
    const group = new THREE.Group();

    const pole = new THREE.Mesh(SHARED_RES.torchPoleGeo, SHARED_RES.torchPoleMat);
    pole.position.y = 1.6;
    group.add(pole);

    const bowl = new THREE.Mesh(SHARED_RES.torchBowlGeo, SHARED_RES.torchGoldMat);
    bowl.position.y = 3.2;
    group.add(bowl);

    const flame = new THREE.Mesh(SHARED_RES.torchFlameGeo, SHARED_RES.torchFlameMat);
    flame.position.y = 3.6;
    group.add(flame);

    return group;
  }

  class ParticleManager {
    constructor(scene) {
      this.scene = scene;
      this.dustParticles = [];
      this.debrisParticles = [];
      this.initFireflies();
      this.initDustPool();
    }

    initFireflies() {
      const count = isMobile ? 35 : 55;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const phases = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 36;
        pos[i * 3 + 1] = 1.0 + Math.random() * 7.0;
        pos[i * 3 + 2] = -Math.random() * 120;
        phases[i] = Math.random() * Math.PI * 2;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

      const mat = new THREE.PointsMaterial({
        color: 0xFFEE58,
        size: 0.35,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });

      this.fireflies = new THREE.Points(geo, mat);
      this.scene.add(this.fireflies);
      this.fireflyPos = pos;
      this.fireflyPhases = phases;
    }

    updateFireflies(playerZ, delta, time) {
      const pos = this.fireflies.geometry.attributes.position.array;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        pos[idx + 1] += Math.sin(time * 2.0 + this.fireflyPhases[i]) * 0.015;
        pos[idx] += Math.cos(time * 1.5 + this.fireflyPhases[i]) * 0.015;

        if (pos[idx + 2] > playerZ + 15) {
          pos[idx + 2] = playerZ - 100 - Math.random() * 20;
          pos[idx] = (Math.random() - 0.5) * 36;
        }
      }
      this.fireflies.geometry.attributes.position.needsUpdate = true;
    }

    initDustPool() {
      const geo = new THREE.SphereGeometry(0.14, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xC2B280,
        transparent: true,
        opacity: 0.4
      });
      for (let i = 0; i < 20; i++) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        this.scene.add(mesh);
        this.dustParticles.push({
          mesh,
          vx: 0,
          vy: 0,
          vz: 0,
          life: 0,
          maxLife: 0.45
        });
      }
    }

    emitDust(x, y, z) {
      const p = this.dustParticles.find(item => !item.mesh.visible);
      if (!p) return;
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + 0.1, z + (Math.random() - 0.5) * 0.2);
      p.vx = (Math.random() - 0.5) * 1.2;
      p.vy = 0.8 + Math.random() * 1.2;
      p.vz = 2.0 + Math.random() * 2.0;
      p.life = 0.45;
      p.maxLife = 0.45;
      p.mesh.scale.setScalar(0.7);
      p.mesh.visible = true;
    }

    emitSmashDebris(originX, originY, originZ) {
      const numPieces = isMobile ? 8 : 14;
      for (let i = 0; i < numPieces; i++) {
        const mesh = new THREE.Mesh(SHARED_RES.debrisGeo, SHARED_RES.debrisMat);
        mesh.position.set(originX, originY + 0.5, originZ);
        this.scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 6.0 + Math.random() * 8.0;
        this.debrisParticles.push({
          mesh,
          vx: Math.cos(angle) * speed,
          vy: 5.0 + Math.random() * 6.0,
          vz: -4.0 + (Math.random() - 0.5) * 6.0,
          rx: Math.random() * 8,
          ry: Math.random() * 8,
          life: 1.0
        });
      }
    }

    update(delta) {
      for (let i = 0; i < this.dustParticles.length; i++) {
        const p = this.dustParticles[i];
        if (!p.mesh.visible) continue;
        p.life -= delta;
        if (p.life <= 0) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.x += p.vx * delta;
          p.mesh.position.y += p.vy * delta;
          p.mesh.position.z += p.vz * delta;
          const scale = 0.7 + (1 - p.life / p.maxLife) * 1.6;
          p.mesh.scale.setScalar(scale);
        }
      }

      for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
        const p = this.debrisParticles[i];
        p.life -= delta;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.debrisParticles.splice(i, 1);
        } else {
          p.vy -= 28.0 * delta;
          p.mesh.position.x += p.vx * delta;
          p.mesh.position.y += p.vy * delta;
          p.mesh.position.z += p.vz * delta;
          p.mesh.rotation.x += p.rx * delta;
          p.mesh.rotation.y += p.ry * delta;
          if (p.mesh.position.y < 0.1) {
            p.mesh.position.y = 0.1;
            p.vy = -p.vy * 0.4;
          }
        }
      }
    }
  }

  class TrackChunk {
    constructor(scene, zPosition) {
      this.scene = scene;
      this.group = new THREE.Group();
      this.zPosition = zPosition;
      this.items = [];
      this.buildTrackGeometry();
      this.group.position.z = zPosition;
      this.scene.add(this.group);
    }

    buildTrackGeometry() {
      const path = new THREE.Mesh(SHARED_RES.pathGeo, SHARED_RES.pathMat);
      path.rotation.x = -Math.PI / 2;
      this.group.add(path);

      const leftCurb = new THREE.Mesh(SHARED_RES.curbGeo, SHARED_RES.curbMat);
      leftCurb.position.set(-CONFIG.LANE_WIDTH * 1.8, 0.1, 0);
      this.group.add(leftCurb);

      const rightCurb = leftCurb.clone();
      rightCurb.position.x = CONFIG.LANE_WIDTH * 1.8;
      this.group.add(rightCurb);

      const leftForest = new THREE.Mesh(SHARED_RES.forestSideGeo, SHARED_RES.forestSideMat);
      leftForest.rotation.x = -Math.PI / 2;
      leftForest.position.set(-19, -0.05, 0);
      this.group.add(leftForest);

      const rightForest = leftForest.clone();
      rightForest.position.x = 19;
      this.group.add(rightForest);

      const tree1 = createBanyanTree();
      tree1.position.set(-8.5 - Math.random() * 2, 0, -CONFIG.CHUNK_LENGTH * 0.25);
      this.group.add(tree1);

      const tree2 = createBanyanTree();
      tree2.position.set(8.5 + Math.random() * 2, 0, CONFIG.CHUNK_LENGTH * 0.25);
      this.group.add(tree2);

      const torch = createTorch();
      torch.position.set(CONFIG.LANE_WIDTH * 1.95, 0, 0);
      this.group.add(torch);
    }

    populate(difficulty) {
      this.clearItems();

      const lanes = CONFIG.LANES;
      const zOffsets = [-14, 0, 14];

      for (let zi = 0; zi < zOffsets.length; zi++) {
        const zOff = zOffsets[zi];
        const roll = Math.random();

        if (roll < 0.65) {
          const shuffledLanes = [lanes[0], lanes[1], lanes[2]];
          for (let i = shuffledLanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = shuffledLanes[i];
            shuffledLanes[i] = shuffledLanes[j];
            shuffledLanes[j] = temp;
          }

          const numObstacles = (difficulty > 1.4 && Math.random() < 0.4) ? 2 : 1;

          for (let i = 0; i < numObstacles; i++) {
            const laneX = shuffledLanes[i];
            const obsType = Math.random();
            let obstacleMesh;

            if (obsType < 0.38) {
              obstacleMesh = createLogObstacle();
            } else if (obsType < 0.72) {
              obstacleMesh = createBranchObstacle();
            } else {
              obstacleMesh = createBoulderObstacle();
            }

            obstacleMesh.position.set(laneX, 0, zOff);
            this.group.add(obstacleMesh);
            this.items.push(obstacleMesh);
          }

          const openLane = shuffledLanes[numObstacles];
          const itemRoll = Math.random();

          if (itemRoll < 0.10 && difficulty > 1.1) {
            const magnet = createMagnetMesh();
            magnet.position.set(openLane, 1.2, zOff);
            this.group.add(magnet);
            this.items.push(magnet);
          } else if (itemRoll < 0.16 && difficulty > 1.2) {
            const boost = createBoostMesh();
            boost.position.set(openLane, 1.2, zOff);
            this.group.add(boost);
            this.items.push(boost);
          } else {
            for (let k = -2; k <= 2; k += 2) {
              const laddu = createLadduMesh();
              laddu.position.set(openLane, 1.0, zOff + k * 1.5);
              this.group.add(laddu);
              this.items.push(laddu);
            }
          }
        } else {
          const lane = lanes[Math.floor(Math.random() * lanes.length)];
          for (let k = -3; k <= 3; k += 1.8) {
            const laddu = createLadduMesh();
            const yArc = 1.0 + Math.sin(((k + 3) / 6) * Math.PI) * 1.2;
            laddu.position.set(lane, yArc, zOff + k);
            this.group.add(laddu);
            this.items.push(laddu);
          }
        }
      }
    }

    clearItems() {
      for (let i = 0; i < this.items.length; i++) {
        this.group.remove(this.items[i]);
      }
      this.items.length = 0;
    }

    reposition(newZ, difficulty) {
      this.zPosition = newZ;
      this.group.position.z = newZ;
      this.populate(difficulty);
    }
  }

  class ChhotaBheemGame {
    constructor() {
      this.canvas = document.getElementById('webgl-canvas');
      this.clock = new THREE.Clock();
      this.sound = new SoundEngine();

      this.state = 'TITLE';
      this.score = 0;
      this.distance = 0;
      this.laddus = 0;
      this.highScore = parseInt(localStorage.getItem('bheem_high_score') || '0', 10);
      this.speedMultiplier = 1.0;
      this.speed = CONFIG.BASE_SPEED * this.speedMultiplier;
      this.difficulty = 1.0;
      this.achievedMilestones = new Set();
      this.milestoneToastTimer = null;

      this.currentLane = 1;
      this.targetLaneX = 0;
      this.playerPos = new THREE.Vector3(0, 0, 0);
      this.playerVelocityY = 0;
      this.isJumping = false;
      this.isSliding = false;
      this.slideTimer = 0;
      this.runAnimTime = 0;
      this.stepTimer = 0;

      this.magnetTimer = 0;
      this.boostTimer = 0;

      this.cameraShakeIntensity = 0;
      this.cameraShakeDecay = 6.0;

      this.initThree();
      this.initLighting();
      this.initPlayer();
      this.initTrack();
      this.particles = new ParticleManager(this.scene);
      this.initInputs();
      this.initUI();

      window.addEventListener('resize', () => this.onWindowResize(), false);

      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0A1813);
      this.scene.fog = new THREE.FogExp2(0x0F251E, 0.016);

      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(CONFIG.FOV_NORMAL, aspect, 0.2, 250);
      this.cameraTarget = new THREE.Vector3(0, 1.8, -4);
      this.cameraBasePos = new THREE.Vector3(0, 4.5, 7.5);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        precision: isMobile ? 'mediump' : 'highp',
        stencil: false
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(basePixelRatio);
      this.renderer.shadowMap.enabled = false;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    }

    initLighting() {
      this.hemiLight = new THREE.HemisphereLight(0xFFA726, 0x051E14, 0.95);
      this.scene.add(this.hemiLight);

      this.ambientLight = new THREE.AmbientLight(0xFFB74D, 0.55);
      this.scene.add(this.ambientLight);

      this.sunLight = new THREE.DirectionalLight(0xFFB74D, 1.4);
      this.sunLight.position.set(12, 22, 10);
      this.sunLight.castShadow = false;
      this.scene.add(this.sunLight);
      this.scene.add(this.sunLight.target);
    }

    initPlayer() {
      this.bheemRig = createChhotaBheemCharacter();
      this.scene.add(this.bheemRig.root);
    }

    initTrack() {
      this.chunks = [];
      for (let i = 0; i < CONFIG.NUM_CHUNKS; i++) {
        const z = -i * CONFIG.CHUNK_LENGTH;
        const chunk = new TrackChunk(this.scene, z);
        if (i > 0) {
          chunk.populate(1.0);
        }
        this.chunks.push(chunk);
      }
    }

    initInputs() {
      window.addEventListener('keydown', (e) => {
        if (this.state === 'TITLE' && (e.code === 'Space' || e.code === 'Enter')) {
          this.startGame();
          return;
        }

        if (e.code === 'KeyP' || e.code === 'Escape') {
          if (this.state === 'PLAYING') this.pauseGame();
          else if (this.state === 'PAUSED') this.resumeGame();
          return;
        }

        if (this.state !== 'PLAYING') return;

        switch (e.code) {
          case 'ArrowLeft':
          case 'KeyA':
            this.moveLane(-1);
            break;
          case 'ArrowRight':
          case 'KeyD':
            this.moveLane(1);
            break;
          case 'ArrowUp':
          case 'KeyW':
          case 'Space':
            this.jump();
            break;
          case 'ArrowDown':
          case 'KeyS':
            this.slide();
            break;
        }
      });

      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;
      let swipeHandled = false;

      const onTouchStart = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        if (e.target && e.target.closest && (e.target.closest('#screen-start') || e.target.closest('#hud-controls-corner') || e.target.closest('.modal-card') || e.target.closest('.hud-controls-corner'))) {
          return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
        swipeHandled = false;

        if (this.state === 'TITLE') {
          this.sound.init();
          this.sound.resume();
          this.startGame();
        }
      };

      const onTouchMove = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        if (this.state !== 'PLAYING' || swipeHandled) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const dx = currentX - touchStartX;
        const dy = currentY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        const threshold = 30;
        if (absDx > threshold || absDy > threshold) {
          swipeHandled = true;
          if (absDx > absDy) {
            if (dx > 0) {
              this.moveLane(1);
            } else {
              this.moveLane(-1);
            }
          } else {
            if (dy < 0) {
              this.jump();
            } else {
              this.slide();
            }
          }
        }
      };

      const onTouchEnd = (e) => {
        if (this.state !== 'PLAYING') return;
        if (swipeHandled) return;
        if (!e.changedTouches || e.changedTouches.length === 0) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - touchStartX;
        const dy = endY - touchStartY;
        const dt = performance.now() - touchStartTime;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        const threshold = 25;
        if (dt < 450 && (absDx > threshold || absDy > threshold)) {
          swipeHandled = true;
          if (absDx > absDy) {
            if (dx > 0) {
              this.moveLane(1);
            } else {
              this.moveLane(-1);
            }
          } else {
            if (dy < 0) {
              this.jump();
            } else {
              this.slide();
            }
          }
        }
      };

      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('touchcancel', () => { swipeHandled = true; }, { passive: true });
    }

    initUI() {
      this.ui = {
        hud: document.getElementById('hud'),
        distance: document.getElementById('hud-distance'),
        laddus: document.getElementById('hud-laddus'),
        multiplier: document.getElementById('hud-multiplier'),
        highScore: document.getElementById('hud-high-score'),
        screenStart: document.getElementById('screen-start'),
        screenPause: document.getElementById('screen-pause'),
        screenGameOver: document.getElementById('screen-gameover'),
        btnPlay: document.getElementById('btn-play'),
        btnResume: document.getElementById('btn-resume'),
        btnPause: document.getElementById('btn-pause'),
        btnRestart: document.getElementById('btn-restart'),
        btnPauseRestart: document.getElementById('btn-pause-restart'),
        btnHome: document.getElementById('btn-home'),
        btnSoundToggle: document.getElementById('btn-sound-toggle'),
        soundIcon: document.getElementById('sound-icon'),
        btnQuality: document.getElementById('btn-quality'),
        speedFx: document.getElementById('speed-fx'),
        screenFlash: document.getElementById('screen-flash'),
        magnetContainer: document.getElementById('magnet-bar-container'),
        magnetFill: document.getElementById('magnet-bar-fill'),
        magnetText: document.getElementById('magnet-timer-text'),
        boostContainer: document.getElementById('boost-bar-container'),
        boostFill: document.getElementById('boost-bar-fill'),
        boostText: document.getElementById('boost-timer-text'),
        milestoneToast: document.getElementById('milestone-toast'),
        speedSelect: document.getElementById('speed-select'),
        goDistance: document.getElementById('go-distance'),
        goLaddus: document.getElementById('go-laddus'),
        goTotalScore: document.getElementById('go-total-score'),
        goHighScore: document.getElementById('go-high-score'),
        goBadge: document.getElementById('new-high-score-badge')
      };

      this.ui.highScore.innerText = this.highScore;

      this.ui.btnPlay.addEventListener('click', () => {
        this.sound.init();
        this.sound.resume();
        this.startGame();
      });

      this.ui.btnResume.addEventListener('click', () => this.resumeGame());
      if (this.ui.btnPause) {
        this.ui.btnPause.addEventListener('click', () => this.pauseGame());
      }
      const speedBtns = document.querySelectorAll('.speed-btn');
      if (this.ui.speedSelect) {
        this.ui.speedSelect.addEventListener('change', (e) => {
          const val = parseFloat(e.target.value) || 1.0;
          this.speedMultiplier = val;
          speedBtns.forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.speed) === val);
          });
        });
      }
      speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = parseFloat(btn.dataset.speed) || 1.0;
          this.speedMultiplier = val;
          if (this.ui.speedSelect) this.ui.speedSelect.value = val.toString();
          speedBtns.forEach(b => b.classList.toggle('active', b === btn));
        });
      });

      const onRestartClick = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.gameOverTimeout) {
          clearTimeout(this.gameOverTimeout);
          this.gameOverTimeout = null;
        }

        this.ui.screenGameOver.style.display = 'none';
        this.ui.screenGameOver.classList.remove('active');
        this.ui.screenGameOver.classList.add('hidden');

        this.ui.screenStart.style.display = 'none';
        this.ui.screenStart.classList.remove('active');
        this.ui.screenStart.classList.add('hidden');

        this.ui.screenPause.style.display = 'none';
        this.ui.screenPause.classList.remove('active');
        this.ui.screenPause.classList.add('hidden');

        this.startGame();
      };

      this.ui.btnRestart.addEventListener('click', onRestartClick);
      this.ui.btnRestart.addEventListener('touchend', onRestartClick);
      this.ui.btnPauseRestart.addEventListener('click', onRestartClick);
      this.ui.btnPauseRestart.addEventListener('touchend', onRestartClick);

      if (this.ui.btnHome) {
        const onHomeClick = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          this.goToHome();
        };
        this.ui.btnHome.addEventListener('click', onHomeClick);
        this.ui.btnHome.addEventListener('touchend', onHomeClick);
      }

      this.ui.btnSoundToggle.addEventListener('click', () => {
        this.sound.init();
        const on = this.sound.toggle();
        this.ui.soundIcon.innerText = on ? '🔊' : '🔇';
      });

      this.isUltraGraphics = false;
      this.ui.btnQuality.innerText = 'PERFORMANCE (Smooth 60 FPS)';
      this.ui.btnQuality.addEventListener('click', () => {
        this.isUltraGraphics = !this.isUltraGraphics;
        if (this.isUltraGraphics) {
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFShadowMap;
          this.sunLight.castShadow = true;
          this.sunLight.shadow.mapSize.width = 512;
          this.sunLight.shadow.mapSize.height = 512;
          this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          this.ui.btnQuality.innerText = 'ULTRA (Shadows On)';
        } else {
          this.renderer.shadowMap.enabled = false;
          this.sunLight.castShadow = false;
          this.renderer.setPixelRatio(basePixelRatio);
          this.ui.btnQuality.innerText = 'PERFORMANCE (Smooth 60 FPS)';
        }
      });
    }

    moveLane(direction) {
      const newLane = this.currentLane + direction;
      if (newLane >= 0 && newLane <= 2) {
        this.currentLane = newLane;
        this.targetLaneX = CONFIG.LANES[this.currentLane];
        this.sound.playFootstep();
      }
    }

    jump() {
      if (!this.isJumping) {
        this.isJumping = true;
        this.isSliding = false;
        this.playerVelocityY = CONFIG.JUMP_VELOCITY;
        this.sound.playJump();
        this.particles.emitDust(this.playerPos.x, 0, this.playerPos.z);
      }
    }

    slide() {
      if (!this.isSliding) {
        this.isSliding = true;
        this.slideTimer = CONFIG.SLIDE_DURATION;
        this.sound.playSlide();
        this.particles.emitDust(this.playerPos.x, 0, this.playerPos.z);

        if (this.isJumping) {
          this.playerVelocityY = -22.0;
        }
      }
    }

    triggerScreenShake(intensity = 0.4) {
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, intensity);
    }

    triggerScreenFlash(type = 'flash-gold') {
      this.ui.screenFlash.className = type;
      setTimeout(() => {
        this.ui.screenFlash.className = '';
      }, 200);
    }

    startGame() {
      if (this.gameOverTimeout) {
        clearTimeout(this.gameOverTimeout);
        this.gameOverTimeout = null;
      }

      this.ui.screenGameOver.style.display = 'none';
      this.ui.screenGameOver.classList.remove('active');
      this.ui.screenGameOver.classList.add('hidden');

      this.ui.screenStart.style.display = 'none';
      this.ui.screenStart.classList.remove('active');
      this.ui.screenStart.classList.add('hidden');

      this.ui.screenPause.style.display = 'none';
      this.ui.screenPause.classList.remove('active');
      this.ui.screenPause.classList.add('hidden');

      this.ui.hud.style.display = 'flex';
      this.ui.hud.classList.remove('hidden');
      this.ui.speedFx.classList.remove('active');

      if (this.ui.btnHome) {
        this.ui.btnHome.classList.remove('hidden');
      }

      this.state = 'PLAYING';
      this.score = 0;
      this.distance = 0;
      this.laddus = 0;
      this.speed = CONFIG.BASE_SPEED * this.speedMultiplier;
      this.difficulty = 1.0;
      this.achievedMilestones.clear();
      if (this.milestoneToastTimer) {
        clearTimeout(this.milestoneToastTimer);
        this.milestoneToastTimer = null;
      }
      if (this.ui.milestoneToast) {
        this.ui.milestoneToast.classList.add('hidden');
        this.ui.milestoneToast.classList.remove('active', 'fading');
      }

      this.currentLane = 1;
      this.targetLaneX = CONFIG.LANES[1];
      this.playerPos.set(0, 0, 0);
      this.playerVelocityY = 0;
      this.isJumping = false;
      this.isSliding = false;
      this.slideTimer = 0;

      this.magnetTimer = 0;
      this.boostTimer = 0;

      for (let i = 0; i < this.chunks.length; i++) {
        const z = -i * CONFIG.CHUNK_LENGTH;
        this.chunks[i].reposition(z, 1.0);
        if (i === 0) this.chunks[i].clearItems();
      }

      this.sound.resume();
      this.sound.duckBGM(false);
    }

    pauseGame() {
      if (this.state !== 'PLAYING') return;
      this.state = 'PAUSED';
      this.sound.duckBGM(true);
      this.ui.screenPause.classList.remove('hidden');
      this.ui.screenPause.classList.add('active');
      this.ui.screenPause.style.display = 'flex';
    }

    resumeGame() {
      if (this.state !== 'PAUSED') return;
      this.state = 'PLAYING';
      this.sound.duckBGM(false);
      this.ui.screenPause.style.display = 'none';
      this.ui.screenPause.classList.remove('active');
      this.ui.screenPause.classList.add('hidden');
      this.clock.getDelta();
    }

    goToHome() {
      if (this.gameOverTimeout) {
        clearTimeout(this.gameOverTimeout);
        this.gameOverTimeout = null;
      }
      if (this.milestoneToastTimer) {
        clearTimeout(this.milestoneToastTimer);
        this.milestoneToastTimer = null;
      }

      this.state = 'TITLE';
      this.score = 0;
      this.distance = 0;
      this.laddus = 0;
      this.difficulty = 1.0;
      this.speed = CONFIG.BASE_SPEED * this.speedMultiplier;
      this.achievedMilestones.clear();

      this.currentLane = 1;
      this.targetLaneX = CONFIG.LANES[1];
      this.playerPos.set(0, 0, 0);
      this.playerVelocityY = 0;
      this.isJumping = false;
      this.isSliding = false;
      this.slideTimer = 0;
      this.runAnimTime = 0;
      this.stepTimer = 0;
      this.magnetTimer = 0;
      this.boostTimer = 0;
      this.cameraShakeIntensity = 0;

      if (this.bheemRig && this.bheemRig.auraMat) {
        this.bheemRig.auraMat.opacity = 0.0;
      }

      for (let i = 0; i < this.chunks.length; i++) {
        const z = -i * CONFIG.CHUNK_LENGTH;
        this.chunks[i].reposition(z, 1.0);
        if (i === 0) this.chunks[i].clearItems();
      }

      this.camera.fov = CONFIG.FOV_NORMAL;
      this.camera.updateProjectionMatrix();

      this.sound.duckBGM(false);

      if (this.ui.speedFx) this.ui.speedFx.classList.remove('active');
      if (this.ui.screenFlash) this.ui.screenFlash.className = '';
      if (this.ui.milestoneToast) {
        this.ui.milestoneToast.classList.add('hidden');
        this.ui.milestoneToast.classList.remove('active', 'fading');
      }
      if (this.ui.magnetContainer) this.ui.magnetContainer.classList.add('hidden');
      if (this.ui.boostContainer) this.ui.boostContainer.classList.add('hidden');

      this.ui.hud.style.display = 'none';
      this.ui.hud.classList.remove('active');
      this.ui.hud.classList.add('hidden');

      this.ui.screenPause.style.display = 'none';
      this.ui.screenPause.classList.remove('active');
      this.ui.screenPause.classList.add('hidden');

      this.ui.screenGameOver.style.display = 'none';
      this.ui.screenGameOver.classList.remove('active');
      this.ui.screenGameOver.classList.add('hidden');

      this.ui.screenStart.style.display = 'flex';
      this.ui.screenStart.classList.remove('hidden');
      this.ui.screenStart.classList.add('active');

      if (this.ui.btnHome) {
        this.ui.btnHome.classList.add('hidden');
      }

      if (this.ui.highScore) {
        this.ui.highScore.innerText = this.highScore;
      }

      const speedBtns = document.querySelectorAll('.speed-btn');
      speedBtns.forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.dataset.speed) === this.speedMultiplier);
      });
      if (this.ui.speedSelect) {
        this.ui.speedSelect.value = this.speedMultiplier.toString();
      }
    }

    gameOver() {
      if (this.state === 'GAMEOVER') return;
      this.state = 'GAMEOVER';
      this.sound.playCrash();
      this.triggerScreenShake(0.85);
      this.triggerScreenFlash('flash-red');

      const isNewBest = this.distance > this.highScore;
      if (isNewBest) {
        this.highScore = Math.floor(this.distance);
        localStorage.setItem('bheem_high_score', this.highScore.toString());
      }

      const totalScore = Math.floor(this.distance + this.laddus * 10);
      this.ui.goDistance.innerText = `${Math.floor(this.distance)} m`;
      this.ui.goLaddus.innerText = this.laddus;
      this.ui.goTotalScore.innerText = totalScore;
      this.ui.goHighScore.innerText = `${this.highScore} m`;

      if (isNewBest) {
        this.ui.goBadge.classList.remove('hidden');
      } else {
        this.ui.goBadge.classList.add('hidden');
      }

      if (this.gameOverTimeout) clearTimeout(this.gameOverTimeout);
      this.gameOverTimeout = setTimeout(() => {
        if (this.state === 'GAMEOVER') {
          this.ui.hud.classList.add('hidden');
          this.ui.screenGameOver.classList.remove('hidden');
          this.ui.screenGameOver.classList.add('active');
          this.ui.screenGameOver.style.display = 'flex';
          this.ui.speedFx.classList.remove('active');
          if (this.ui.btnHome) {
            this.ui.btnHome.classList.remove('hidden');
          }
        }
      }, 500);
    }

    checkCollisions() {
      const pX = this.playerPos.x;
      const pY = this.playerPos.y;
      const pZ = this.playerPos.z;

      const playerRadius = 0.55;
      const playerTopY = this.isSliding ? 0.75 : (pY + 1.95);
      const playerBottomY = pY;

      const isBoosted = this.boostTimer > 0;

      for (let c = 0; c < this.chunks.length; c++) {
        const chunk = this.chunks[c];
        const chunkZ = chunk.group.position.z;

        if (Math.abs(chunkZ - pZ) > CONFIG.CHUNK_LENGTH) continue;

        for (let i = chunk.items.length - 1; i >= 0; i--) {
          const item = chunk.items[i];
          const itemWorldX = item.position.x;
          const itemWorldY = item.position.y;
          const itemWorldZ = chunkZ + item.position.z;

          const dx = pX - itemWorldX;
          const dz = pZ - itemWorldZ;
          const distSq = dx * dx + dz * dz;

          const itemType = item.userData.type;

          if (itemType === 'laddu' || itemType === 'magnet' || itemType === 'boost') {
            if (itemType === 'laddu' && this.magnetTimer > 0) {
              if (distSq < CONFIG.MAGNET_RADIUS * CONFIG.MAGNET_RADIUS) {
                item.position.x += (pX - itemWorldX) * 0.15;
                item.position.y += (pY + 0.8 - itemWorldY) * 0.15;
                item.position.z += (pZ - itemWorldZ) * 0.15;
              }
            }

            if (distSq < 1.21 && Math.abs(pY + 0.8 - itemWorldY) < 1.4) {
              if (itemType === 'laddu') {
                this.laddus++;
                this.sound.playLadduCollect();
              } else if (itemType === 'magnet') {
                this.magnetTimer = CONFIG.MAGNET_DURATION;
                this.sound.playPowerUp();
                this.triggerScreenFlash('flash-cyan');
              } else if (itemType === 'boost') {
                this.boostTimer = CONFIG.BOOST_DURATION;
                this.sound.playPowerUp();
                this.triggerScreenFlash('flash-gold');
                this.triggerScreenShake(0.4);
              }

              chunk.group.remove(item);
              chunk.items.splice(i, 1);
              continue;
            }
          } else if (itemType === 'jump_hurdle' || itemType === 'slide_hurdle' || itemType === 'block_hurdle') {
            const data = item.userData;
            const xTolerance = (data.width * 0.5) + playerRadius * 0.7;
            const zTolerance = (data.depth * 0.5) + playerRadius * 0.7;

            if (Math.abs(dx) < xTolerance && Math.abs(dz) < zTolerance) {
              const obsYMin = itemWorldY + data.hitYMin;
              const obsYMax = itemWorldY + data.hitYMax;

              const hasVerticalCollision = (playerBottomY < obsYMax) && (playerTopY > obsYMin);

              if (hasVerticalCollision) {
                if (isBoosted) {
                  this.sound.playSmash();
                  this.triggerScreenShake(0.5);
                  this.particles.emitSmashDebris(itemWorldX, itemWorldY + 0.5, itemWorldZ);
                  chunk.group.remove(item);
                  chunk.items.splice(i, 1);
                } else {
                  this.gameOver();
                  return;
                }
              }
            }
          }
        }
      }
    }

    animate() {
      requestAnimationFrame(this.animate);

      const delta = Math.min(this.clock.getDelta(), 0.05);
      const time = this.clock.getElapsedTime();

      if (this.state === 'PLAYING') {
        this.updateGameplay(delta, time);
      } else if (this.state === 'TITLE' || this.state === 'GAMEOVER') {
        this.updateIdleScene(delta, time);
      }

      this.render();
    }

    updateGameplay(delta, time) {
      const basePace = CONFIG.BASE_SPEED * this.speedMultiplier;
      const distanceProgression = Math.min(6.0, (this.distance / 1000) * 1.5) * this.speedMultiplier;
      const maxCap = CONFIG.MAX_SPEED_CAP * this.speedMultiplier;
      this.speed = Math.min(basePace + distanceProgression, maxCap);
      const currentBoostMult = this.boostTimer > 0 ? 1.5 : 1.0;
      const effectiveSpeed = this.speed * currentBoostMult;

      const distTravelled = effectiveSpeed * delta;
      this.distance += distTravelled;
      this.playerPos.z -= distTravelled;
      this.difficulty = 1.0 + (this.distance / 500);

      this.checkMilestones();

      this.playerPos.x += (this.targetLaneX - this.playerPos.x) * Math.min(delta * 14.0, 1.0);

      if (this.isJumping) {
        this.playerPos.y += this.playerVelocityY * delta;
        this.playerVelocityY += CONFIG.GRAVITY * delta;

        if (this.playerPos.y <= 0) {
          this.playerPos.y = 0;
          this.isJumping = false;
          this.playerVelocityY = 0;
          this.sound.playFootstep();
          this.triggerScreenShake(0.2);
          this.particles.emitDust(this.playerPos.x, 0, this.playerPos.z);
        }
      }

      if (this.isSliding) {
        this.slideTimer -= delta;
        if (Math.random() < 0.4) {
          this.particles.emitDust(this.playerPos.x, 0, this.playerPos.z);
        }
        if (this.slideTimer <= 0) {
          this.isSliding = false;
        }
      }

      if (!this.isJumping && !this.isSliding) {
        this.stepTimer += delta * effectiveSpeed * 0.4;
        if (this.stepTimer > 1.0) {
          this.sound.playFootstep();
          this.stepTimer = 0;
          this.particles.emitDust(this.playerPos.x, 0, this.playerPos.z);
        }
      }

      if (this.magnetTimer > 0) {
        this.magnetTimer -= delta;
        if (this.ui.magnetContainer) {
          this.ui.magnetContainer.classList.remove('hidden');
          this.ui.magnetFill.style.width = `${(this.magnetTimer / CONFIG.MAGNET_DURATION) * 100}%`;
          this.ui.magnetText.innerText = `${Math.ceil(this.magnetTimer)}s`;
        }
        this.bheemRig.auraMat.color.setHex(0x00E5FF);
        this.bheemRig.auraMat.opacity = 0.8;
      } else {
        if (this.ui.magnetContainer) this.ui.magnetContainer.classList.add('hidden');
      }

      if (this.boostTimer > 0) {
        this.boostTimer -= delta;
        if (this.ui.boostContainer) {
          this.ui.boostContainer.classList.remove('hidden');
          this.ui.boostFill.style.width = `${(this.boostTimer / CONFIG.BOOST_DURATION) * 100}%`;
          this.ui.boostText.innerText = `${Math.ceil(this.boostTimer)}s`;
        }
        if (this.ui.speedFx) this.ui.speedFx.classList.add('active');
        this.bheemRig.auraMat.color.setHex(0xFF3D00);
        this.bheemRig.auraMat.opacity = 0.9;
      } else {
        if (this.ui.boostContainer) this.ui.boostContainer.classList.add('hidden');
        if (this.ui.speedFx) this.ui.speedFx.classList.remove('active');
        if (this.magnetTimer <= 0) {
          this.bheemRig.auraMat.opacity = 0.0;
        }
      }

      const targetFov = this.boostTimer > 0 ? CONFIG.FOV_BOOST : CONFIG.FOV_NORMAL;
      this.camera.fov += (targetFov - this.camera.fov) * delta * 4.0;
      this.camera.updateProjectionMatrix();

      this.checkCollisions();
      this.updateChunks();
      this.animateCharacterRig(delta, effectiveSpeed);
      this.particles.update(delta);
      this.particles.updateFireflies(this.playerPos.z, delta, time);
      this.updateCamera(delta);
      this.updateHUD(effectiveSpeed);
    }

    updateChunks() {
      for (let i = 0; i < this.chunks.length; i++) {
        const chunk = this.chunks[i];

        if (chunk.group.position.z > this.playerPos.z + CONFIG.CHUNK_LENGTH * 1.5) {
          let minZ = 0;
          for (let k = 0; k < this.chunks.length; k++) {
            if (this.chunks[k].group.position.z < minZ) {
              minZ = this.chunks[k].group.position.z;
            }
          }
          const newZ = minZ - CONFIG.CHUNK_LENGTH;
          chunk.reposition(newZ, this.difficulty);
        }

        for (let k = 0; k < chunk.items.length; k++) {
          const item = chunk.items[k];
          if (item.userData && item.userData.rotSpeed) {
            item.rotation.y += item.userData.rotSpeed * 0.016;
            if (item.userData.halo) {
              item.userData.halo.rotation.z += 0.03;
            }
            if (item.userData.orbit) {
              item.userData.orbit.rotation.x += 0.04;
            }
          }
        }
      }
    }

    animateCharacterRig(delta, runSpeed) {
      const rig = this.bheemRig;
      rig.root.position.copy(this.playerPos);
      rig.updateAnimation(this.isJumping, this.isSliding, this.state === 'GAMEOVER', delta, runSpeed, this.playerPos.y);
    }

    updateCamera(delta) {
      const targetCamX = this.playerPos.x * 0.65;
      const targetCamY = this.playerPos.y + this.cameraBasePos.y;
      const targetCamZ = this.playerPos.z + this.cameraBasePos.z;

      this.camera.position.x += (targetCamX - this.camera.position.x) * delta * 8.0;
      this.camera.position.y += (targetCamY - this.camera.position.y) * delta * 6.0;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * delta * 12.0;

      if (this.cameraShakeIntensity > 0.001) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.cameraShakeIntensity -= this.cameraShakeIntensity * this.cameraShakeDecay * delta;
      }

      this.cameraTarget.set(this.playerPos.x * 0.5, this.playerPos.y + 1.6, this.playerPos.z - 5);
      this.camera.lookAt(this.cameraTarget);

      this.sunLight.position.set(this.playerPos.x + 12, 22, this.playerPos.z + 10);
      this.sunLight.target.position.set(this.playerPos.x, 0, this.playerPos.z - 8);
    }

    updateIdleScene(delta, time) {
      const radius = 5.2;
      const angle = Math.PI + Math.sin(time * 0.35) * 0.60;
      this.camera.position.set(
        this.playerPos.x + Math.sin(angle) * radius,
        1.95 + Math.sin(time * 0.5) * 0.22,
        this.playerPos.z + Math.cos(angle) * radius
      );
      this.camera.lookAt(this.playerPos.x, 1.40, this.playerPos.z);

      this.bheemRig.root.position.copy(this.playerPos);
      this.bheemRig.updateAnimation(false, false, this.state === 'GAMEOVER', delta, 0, this.playerPos.y);

      this.particles.update(delta);
      this.particles.updateFireflies(this.playerPos.z, delta, time);
    }

    checkMilestones() {
      const currentMeters = Math.floor(this.distance);
      const fixedMilestones = [100, 250, 300, 350, 500, 1000];
      for (let i = 0; i < fixedMilestones.length; i++) {
        const m = fixedMilestones[i];
        if (currentMeters >= m && !this.achievedMilestones.has(m)) {
          this.achievedMilestones.add(m);
          this.showMilestone(m);
          return;
        }
      }
      if (currentMeters > 1000) {
        const interval = 250;
        const intervalMilestone = Math.floor(currentMeters / interval) * interval;
        if (intervalMilestone > 1000 && !this.achievedMilestones.has(intervalMilestone)) {
          this.achievedMilestones.add(intervalMilestone);
          this.showMilestone(intervalMilestone);
        }
      }
    }

    showMilestone(meters) {
      if (!this.ui.milestoneToast) return;
      if (this.milestoneToastTimer) {
        clearTimeout(this.milestoneToastTimer);
      }
      this.ui.milestoneToast.innerHTML = `
        <div class="milestone-card">
          <div class="milestone-tag">🏆 MILESTONE UNLOCKED</div>
          <div class="milestone-msg">Congratulations! You achieved ${meters} Meters!</div>
        </div>
      `;
      this.ui.milestoneToast.classList.remove('hidden', 'fading');
      this.ui.milestoneToast.classList.add('active');
      this.sound.playPowerUp();
      this.triggerScreenFlash('flash-gold');

      this.milestoneToastTimer = setTimeout(() => {
        if (this.ui.milestoneToast) {
          this.ui.milestoneToast.classList.remove('active');
          this.ui.milestoneToast.classList.add('fading');
          setTimeout(() => {
            if (this.ui.milestoneToast) {
              this.ui.milestoneToast.classList.remove('fading');
              this.ui.milestoneToast.classList.add('hidden');
            }
          }, 400);
        }
      }, 2500);
    }

    updateHUD(currentSpeed) {
      if (this.ui.distance) this.ui.distance.innerText = Math.floor(this.distance);
      if (this.ui.highScore) this.ui.highScore.innerText = this.highScore;
      if (this.ui.laddus) this.ui.laddus.innerText = this.laddus;
      if (this.ui.multiplier) {
        const speedMult = (currentSpeed / (CONFIG.BASE_SPEED * this.speedMultiplier)).toFixed(1);
        this.ui.multiplier.innerText = `${speedMult}x SPEED`;
      }
    }

    onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      const pr = this.isUltraGraphics ? Math.min(window.devicePixelRatio || 1, 2) : basePixelRatio;
      this.renderer.setPixelRatio(pr);
    }

    render() {
      this.renderer.render(this.scene, this.camera);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new ChhotaBheemGame();
  });

})();
