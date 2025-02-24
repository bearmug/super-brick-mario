export class AudioManager {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 120; // Disco tempo
  private currentStep: number = 0;
  private currentPhrase: number = 0;
  private mainVolume: number = 0.15;

  // Four-on-the-floor electronic dance sequence
  private sequence = [
    // Phrase 1: Funky Intro
    [
      { notes: [293.66], duration: 0.25 }, // D4 (funky rhythm)
      { notes: [349.23], duration: 0.25 }, // F4
      { notes: [392.00], duration: 0.25 }, // G4
      { notes: [440.00], duration: 0.25 }, // A4
      { notes: [493.88], duration: 0.5 },  // B4 (accent)
      { notes: [440.00], duration: 0.25 }, // A4
      { notes: [392.00], duration: 0.25 }, // G4
      { notes: [349.23], duration: 0.5 },  // F4 (accent)
    ],
    // Phrase 2: Electronic Build
    [
      { notes: [392.00], duration: 0.125 }, // G4 (quick)
      { notes: [440.00], duration: 0.125 }, // A4
      { notes: [493.88], duration: 0.25 },  // B4
      { notes: [523.25], duration: 0.5 },   // C5 (hold)
      { notes: [493.88], duration: 0.25 },  // B4
      { notes: [440.00], duration: 0.25 },  // A4
      { notes: [392.00], duration: 0.5 },   // G4 (accent)
    ],
    // Phrase 3: Groove Peak
    [
      { notes: [523.25], duration: 0.125 }, // C5 (quick)
      { notes: [587.33], duration: 0.125 }, // D5
      { notes: [659.25], duration: 0.25 },  // E5
      { notes: [587.33], duration: 0.5 },   // D5 (hold)
      { notes: [523.25], duration: 0.25 },  // C5
      { notes: [493.88], duration: 0.25 },  // B4
      { notes: [440.00], duration: 0.5 },   // A4 (accent)
    ],
    // Phrase 4: Electronic Bridge
    [
      { notes: [392.00], duration: 0.25 }, // G4
      { notes: [440.00], duration: 0.25 }, // A4
      { notes: [493.88], duration: 0.25 }, // B4
      { notes: [523.25], duration: 0.25 }, // C5
      { notes: [587.33], duration: 0.5 },  // D5 (hold)
      { notes: [523.25], duration: 0.25 }, // C5
      { notes: [493.88], duration: 0.25 }, // B4
    ]
  ];

  // Funky bassline with electronic elements
  private bassLine = [
    { note: 196.00, duration: 2, type: 'sine' as OscillatorType },    // G3
    { note: 220.00, duration: 2, type: 'sine' as OscillatorType },    // A3
    { note: 246.94, duration: 2, type: 'sine' as OscillatorType },    // B3
    { note: 261.63, duration: 2, type: 'sine' as OscillatorType }     // C4
  ];

  constructor() {
    // Don't initialize audio context in constructor
    // Wait for user interaction
  }

  private initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.mainVolume;
    }
  }

  playNote(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 1) {
    if (!this.audioContext || !this.gainNode) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // Subtle detuning for electronic warmth
    oscillator.detune.value = Math.random() * 10 - 5;
    
    oscillator.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    // Smooth envelope for electronic feel
    const now = this.audioContext.currentTime;
    const attackTime = 0.05;
    const releaseTime = 0.1;
    
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(volume, now + attackTime);
    noteGain.gain.setValueAtTime(volume, now + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return oscillator;
  }

  private playBass(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext) return;
    
    // Layer bass sounds for richness
    const subBass = this.playNote(frequency / 2, duration, 'sine', 0.4);
    const mainBass = this.playNote(frequency, duration, type, 0.3);
    if (subBass && mainBass) {
      this.oscillators.push(subBass, mainBass);
    }
  }

  startMusic() {
    this.initializeAudioContext();
    if (this.isPlaying) this.stopMusic();
    
    // Resume audio context if it was suspended
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.currentStep = 0;
    this.currentPhrase = 0;
    this.playLoop();
  }

  private _timeoutId: number | undefined;

  private playLoop = () => {
    if (!this.isPlaying || !this.audioContext) return;

    const currentPhrase = this.sequence[this.currentPhrase];
    const step = currentPhrase[this.currentStep];
    const bassDuration = 60 / this.bpm * 8; // 8 beats per bass note

    // Play melody
    this.playNote(step.notes[0], 60 / this.bpm * step.duration);

    // Play bass line with rhythm
    if (this.currentStep % 2 === 0) {
      const bass = this.bassLine[this.currentPhrase];
      this.playBass(bass.note, bassDuration * 0.5, bass.type);
    }

    // Advance sequence
    this.currentStep++;
    if (this.currentStep >= currentPhrase.length) {
      this.currentStep = 0;
      this.currentPhrase = (this.currentPhrase + 1) % this.sequence.length;
    }

    // Schedule next step with stored timeout ID
    this._timeoutId = setTimeout(this.playLoop, 60 / this.bpm * step.duration * 1000) as unknown as number;
  }

  stopMusic() {
    this.isPlaying = false;
    
    // Clear any pending playLoop timeouts
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
    }
    
    // Stop all oscillators
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore errors from already stopped oscillators
      }
    });
    this.oscillators = [];
    
    // Reset sequence position
    this.currentStep = 0;
    this.currentPhrase = 0;
  }

  setVolume(volume: number) {
    this.mainVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.mainVolume;
    }
  }
} 