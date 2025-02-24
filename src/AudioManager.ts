export class AudioManager {
  private audioContext: AudioContext;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode;
  private isPlaying: boolean = false;
  private bpm: number = 135; // Even more energetic tempo!
  private currentStep: number = 0;
  private currentPhrase: number = 0;
  private mainVolume: number = 0.15;

  // High-energy rock-disco fusion sequence
  private sequence = [
    // Phrase 1: Power Intro (15 seconds)
    [
      { notes: [440.00], duration: 0.25 }, // A4 (quick)
      { notes: [440.00], duration: 0.25 }, // A4 (quick)
      { notes: [523.25], duration: 0.25 }, // C5 (quick)
      { notes: [587.33], duration: 0.25 }, // D5 (quick)
      { notes: [659.25], duration: 0.5 },  // E5 (power accent)
      { notes: [587.33], duration: 0.25 }, // D5 (quick)
      { notes: [523.25], duration: 0.25 }, // C5 (quick)
      { notes: [587.33], duration: 0.5 },  // D5 (power accent)
      { notes: [523.25], duration: 0.25 }, // C5 (quick)
      { notes: [440.00], duration: 0.25 }, // A4 (quick)
    ],
    // Phrase 2: Rock Build-up (15 seconds)
    [
      { notes: [523.25], duration: 0.125 }, // C5 (super quick)
      { notes: [587.33], duration: 0.125 }, // D5 (super quick)
      { notes: [659.25], duration: 0.125 }, // E5 (super quick)
      { notes: [698.46], duration: 0.125 }, // F5 (super quick)
      { notes: [783.99], duration: 0.5 },   // G5 (power hold)
      { notes: [698.46], duration: 0.25 },  // F5 (quick)
      { notes: [659.25], duration: 0.25 },  // E5 (quick)
      { notes: [783.99], duration: 0.5 },   // G5 (power hold)
      { notes: [698.46], duration: 0.25 },  // F5 (quick)
      { notes: [659.25], duration: 0.25 },  // E5 (quick)
    ],
    // Phrase 3: Peak Energy (15 seconds)
    [
      { notes: [880.00], duration: 0.125 }, // A5 (super quick)
      { notes: [880.00], duration: 0.125 }, // A5 (super quick)
      { notes: [987.77], duration: 0.125 }, // B5 (super quick)
      { notes: [1046.50], duration: 0.125 },// C6 (super quick)
      { notes: [880.00], duration: 0.5 },   // A5 (power hold)
      { notes: [783.99], duration: 0.25 },  // G5 (quick)
      { notes: [698.46], duration: 0.25 },  // F5 (quick)
      { notes: [659.25], duration: 0.5 },   // E5 (power hold)
      { notes: [587.33], duration: 0.25 },  // D5 (quick)
      { notes: [523.25], duration: 0.25 },  // C5 (quick)
    ],
    // Phrase 4: Epic Finale (15 seconds)
    [
      { notes: [659.25], duration: 0.125 }, // E5 (super quick)
      { notes: [783.99], duration: 0.125 }, // G5 (super quick)
      { notes: [880.00], duration: 0.125 }, // A5 (super quick)
      { notes: [987.77], duration: 0.125 }, // B5 (super quick)
      { notes: [1046.50], duration: 0.5 },  // C6 (power hold)
      { notes: [987.77], duration: 0.25 },  // B5 (quick)
      { notes: [880.00], duration: 0.25 },  // A5 (quick)
      { notes: [783.99], duration: 0.5 },   // G5 (power hold)
      { notes: [659.25], duration: 0.5 },   // E5 (final power)
    ]
  ];

  // High-energy bass line with shorter, punchier notes
  private bassLine = [
    { note: 220.00, duration: 2, type: 'square' as OscillatorType },   // A3 (punchy square)
    { note: 277.18, duration: 2, type: 'square' as OscillatorType },   // C#4 (punchy square)
    { note: 329.63, duration: 2, type: 'square' as OscillatorType },   // E4 (punchy square)
    { note: 392.00, duration: 2, type: 'square' as OscillatorType }    // G4 (punchy square)
  ];

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = this.mainVolume;
  }

  playNote(frequency: number, duration: number, type: OscillatorType = 'square', volume: number = 1) {
    const oscillator = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // More aggressive detuning for rock sound
    oscillator.detune.value = Math.random() * 20 - 10;
    
    oscillator.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    // Super snappy envelope for rock feel
    const now = this.audioContext.currentTime;
    const attackTime = 0.02;
    const releaseTime = 0.08;
    
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(volume * 1.2, now + attackTime); // Slight overdrive
    noteGain.gain.setValueAtTime(volume, now + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    return oscillator;
  }

  private playBass(frequency: number, duration: number, type: OscillatorType = 'square') {
    // Add distortion to bass for rock feel
    const subBass = this.playNote(frequency / 2, duration, 'square', 0.4);
    const mainBass = this.playNote(frequency, duration, type, 0.3);
    this.oscillators.push(subBass, mainBass);
  }

  startMusic() {
    if (this.isPlaying) this.stopMusic();
    this.isPlaying = true;
    this.currentStep = 0;
    this.currentPhrase = 0;
    this.playLoop();
  }

  private playLoop = () => {
    if (!this.isPlaying) return;

    const currentPhrase = this.sequence[this.currentPhrase];
    const step = currentPhrase[this.currentStep];
    const bassDuration = 60 / this.bpm * 8; // 8 beats per bass note

    // Play melody
    this.playNote(step.notes[0], 60 / this.bpm * step.duration);

    // Play bass line at the start of each phrase
    if (this.currentStep === 0) {
      const bass = this.bassLine[this.currentPhrase];
      this.playBass(bass.note, bassDuration, bass.type);
    }

    // Advance sequence
    this.currentStep++;
    if (this.currentStep >= currentPhrase.length) {
      this.currentStep = 0;
      this.currentPhrase = (this.currentPhrase + 1) % this.sequence.length;
    }

    // Schedule next step
    setTimeout(this.playLoop, 60 / this.bpm * step.duration * 1000);
  }

  stopMusic() {
    this.isPlaying = false;
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore errors from already stopped oscillators
      }
    });
    this.oscillators = [];
  }

  setVolume(volume: number) {
    this.mainVolume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.mainVolume;
  }
} 