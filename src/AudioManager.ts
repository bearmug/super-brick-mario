export class AudioManager {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 130; // Slower tempo like Moby's downtempo tracks
  private currentStep: number = 0;
  private currentPhrase: number = 0;
  private mainVolume: number = 0.2; // Increased volume even more
  private debugMode: boolean = true; // Add debug mode

  // Moby-inspired electronic sequence with iconic elements
  private sequence = [
    // Phrase 1: Ambient Piano-like Intro (inspired by "Porcelain")
    [
      { notes: [261.63], duration: 0.5, type: 'sine' },  // C4 (sustained piano-like)
      { notes: [293.66], duration: 0.5, type: 'sine' },  // D4 (sustained piano-like)
      { notes: [329.63], duration: 0.5, type: 'sine' },  // E4 (sustained piano-like)
      { notes: [349.23], duration: 0.5, type: 'sine' },  // F4 (sustained piano-like)
    ],
    // Phrase 2: Driving Build (inspired by "Natural Blues")
    [
      { notes: [392.00], duration: 0.25, type: 'sawtooth' },  // G4 (quick synth)
      { notes: [392.00], duration: 0.25, type: 'sawtooth' },  // G4 (quick synth)
      { notes: [440.00], duration: 0.5, type: 'sawtooth' },   // A4 (sustained synth)
      { notes: [392.00], duration: 0.25, type: 'sawtooth' },  // G4 (quick synth)
      { notes: [349.23], duration: 0.25, type: 'sawtooth' },  // F4 (quick synth)
      { notes: [329.63], duration: 0.5, type: 'sawtooth' },   // E4 (sustained synth)
    ],
    // Phrase 3: Energetic Peak (inspired by "Bodyrock")
    [
      { notes: [523.25], duration: 0.125, type: 'square' }, // C5 (very quick)
      { notes: [523.25], duration: 0.125, type: 'square' }, // C5 (very quick)
      { notes: [587.33], duration: 0.25, type: 'square' },  // D5 (quick)
      { notes: [523.25], duration: 0.125, type: 'square' }, // C5 (very quick)
      { notes: [523.25], duration: 0.125, type: 'square' }, // C5 (very quick)
      { notes: [587.33], duration: 0.25, type: 'square' },  // D5 (quick)
      { notes: [659.25], duration: 0.5, type: 'square' },   // E5 (sustained)
      { notes: [587.33], duration: 0.5, type: 'square' },   // D5 (sustained)
    ],
    // Phrase 4: Ambient Resolution (inspired by "Why Does My Heart Feel So Bad?")
    [
      { notes: [392.00], duration: 0.75, type: 'sine' },  // G4 (long sustained)
      { notes: [349.23], duration: 0.5, type: 'sine' },   // F4 (sustained)
      { notes: [329.63], duration: 0.75, type: 'sine' },  // E4 (long sustained)
      { notes: [293.66], duration: 0.5, type: 'sine' },   // D4 (sustained)
      { notes: [261.63], duration: 1.0, type: 'sine' },   // C4 (very long sustained)
    ]
  ];

  // Driving electronic bassline inspired by Moby's distinctive bass
  private bassLine = [
    { note: 65.41, duration: 2, type: 'square' as OscillatorType },    // C2 (deep bass)
    { note: 73.42, duration: 2, type: 'square' as OscillatorType },    // D2 (deep bass)
    { note: 82.41, duration: 2, type: 'square' as OscillatorType },    // E2 (deep bass)
    { note: 98.00, duration: 2, type: 'square' as OscillatorType }     // G2 (deep bass)
  ];

  // Percussion patterns inspired by Moby's electronic beats
  private percussionPatterns = [
    [1, 0, 0, 1, 0, 1, 0, 0], // Basic pattern
    [1, 0, 1, 1, 0, 1, 0, 1], // More intense
    [1, 1, 0, 1, 1, 0, 1, 0], // Syncopated
    [1, 0, 1, 0, 1, 0, 1, 0]  // Regular
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
      
      if (this.debugMode) {
        console.log('Audio context initialized:', this.audioContext.state);
      }
    }
  }

  playNote(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 1) {
    if (!this.audioContext || !this.gainNode) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // Minimal detuning for clean electronic sound
    oscillator.detune.value = Math.random() * 5 - 2.5;
    
    oscillator.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    // Electronic envelope with fast attack
    const now = this.audioContext.currentTime;
    const attackTime = 0.02;
    const releaseTime = 0.15;
    
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(volume, now + attackTime);
    noteGain.gain.setValueAtTime(volume, now + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return oscillator;
  }

  private playBass(frequency: number, duration: number, type: OscillatorType = 'square') {
    if (!this.audioContext) return;
    
    // Layered bass for electronic richness
    const subBass = this.playNote(frequency / 2, duration, 'sine', 0.8);
    const mainBass = this.playNote(frequency, duration, type, 0.7);
    if (subBass && mainBass) {
      this.oscillators.push(subBass, mainBass);
    }
    
    // Add a rhythmic pulse on every other beat
    if (this.currentStep % 2 === 0) {
      const pulseBass = this.playNote(frequency * 2, 0.05, 'sawtooth', 0.3);
      if (pulseBass) {
        this.oscillators.push(pulseBass);
      }
    }
  }

  private playPercussion(beatIndex: number) {
    if (!this.audioContext) return;
    
    const pattern = this.percussionPatterns[this.currentPhrase];
    if (pattern[beatIndex % pattern.length]) {
      // Kick drum
      this.playKick();
    }
    
    // Hi-hat on every other 8th note
    if (beatIndex % 2 === 0) {
      this.playSimpleHihat();
    }
  }

  private playKick() {
    if (!this.audioContext || !this.gainNode) return;
    
    // Create oscillator for kick
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    osc.frequency.value = 150;
    osc.type = 'sine';
    
    gainNode.gain.value = 0.7;
    
    osc.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    const now = this.audioContext.currentTime;
    
    // Pitch envelope - key to a good kick sound
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.7, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.start(now);
    osc.stop(now + 0.2);
    
    this.oscillators.push(osc);
  }

  private playSimpleHihat() {
    if (!this.audioContext || !this.gainNode) return;
    
    // Use white noise approximation with high-frequency oscillator
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // High frequency oscillator
    osc.type = 'square';
    osc.frequency.value = 6000;
    
    // High-pass filter
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    // Connect
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    // Volume envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.05);
    
    this.oscillators.push(osc);
  }

  startMusic() {
    this.initializeAudioContext();
    if (this.isPlaying) this.stopMusic();
    
    // Resume audio context if it was suspended
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Play a startup sound effect
    this.playStartupSound();
    
    this.isPlaying = true;
    this.currentStep = 0;
    this.currentPhrase = 0;
    
    if (this.debugMode) {
      console.log('Starting music loop...');
    }
    
    // Start the music loop after a short delay to ensure audio context is ready
    setTimeout(() => {
      this.playLoop();
    }, 300);
  }

  private _timeoutId: number | undefined;

  private playLoop = () => {
    if (!this.isPlaying || !this.audioContext) {
      if (this.debugMode) {
        console.log('Music loop stopped or audio context missing');
      }
      return;
    }

    if (this.debugMode && this.currentStep === 0) {
      console.log(`Playing phrase ${this.currentPhrase + 1}`);
    }

    const currentPhrase = this.sequence[this.currentPhrase];
    const step = currentPhrase[this.currentStep];
    const stepDuration = 60 / this.bpm * step.duration;
    const bassDuration = 60 / this.bpm * 2; // 2 beats per bass note

    try {
      // Play melody with specified oscillator type
      const melodyOsc = this.playNote(
        step.notes[0], 
        stepDuration, 
        step.type || 'sine', 
        0.6
      );
      
      if (melodyOsc) {
        this.oscillators.push(melodyOsc);
      }
      
      // Add ambient pad on first beat of each phrase
      if (this.currentStep === 0) {
        const padNote = this.playNote(step.notes[0] / 2, bassDuration * 2, 'sine', 0.4);
        if (padNote) {
          this.oscillators.push(padNote);
        }
      }

      // Play bass line with rhythm
      if (this.currentStep % 2 === 0) {
        const bass = this.bassLine[this.currentPhrase];
        this.playBass(bass.note, bassDuration * 0.5, bass.type);
      }
      
      // Play percussion
      this.playPercussion(this.currentStep);

      // Advance sequence
      this.currentStep++;
      if (this.currentStep >= currentPhrase.length) {
        this.currentStep = 0;
        this.currentPhrase = (this.currentPhrase + 1) % this.sequence.length;
      }

      // Schedule next step with stored timeout ID
      this._timeoutId = setTimeout(this.playLoop, stepDuration * 1000) as unknown as number;
    } catch (error) {
      console.error('Error in playLoop:', error);
      // Try to recover by stopping and restarting
      this.stopMusic();
      setTimeout(() => {
        this.startMusic();
      }, 1000);
    }
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
    
    if (this.debugMode) {
      console.log('Music stopped');
    }
  }

  setVolume(volume: number) {
    this.mainVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.mainVolume;
    }
  }

  private playStartupSound() {
    if (!this.audioContext || !this.gainNode) return;
    
    // Play a quick ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const now = this.audioContext.currentTime;
    
    notes.forEach((note, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.frequency.value = note;
      osc.type = 'square';
      
      gain.gain.value = 0.4;
      
      osc.connect(gain);
      gain.connect(this.gainNode!);
      
      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.2);
      
      this.oscillators.push(osc);
    });
    
    if (this.debugMode) {
      console.log('Startup sound played');
    }
  }
} 