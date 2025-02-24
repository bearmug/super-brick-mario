export class Particle {
  private life: number = 1;
  private decay: number;
  private color: string;
  private size: number;
  private rotationSpeed: number;
  private rotation: number = 0;

  constructor(
    public x: number,
    public y: number,
    public velocityX: number,
    public velocityY: number,
    particleType: 'small' | 'medium' | 'large' | 'heal' = 'medium'
  ) {
    if (particleType === 'heal') {
      this.color = this.getRandomHealColor();
      this.size = 4 + Math.random() * 4;
      this.decay = 0.01;
    } else {
      this.color = this.getRandomRainbowColor();
      
      // Varied particle properties based on type
      switch (particleType) {
        case 'small':
          this.size = 2 + Math.random() * 2;
          this.decay = 0.02;
          break;
        case 'large':
          this.size = 6 + Math.random() * 4;
          this.decay = 0.01;
          break;
        default: // medium
          this.size = 4 + Math.random() * 3;
          this.decay = 0.015;
      }
    }
    
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }

  update(): boolean {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.velocityY += 0.1; // Add slight gravity effect
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life;
    
    // Translate to particle position
    ctx.translate(this.x - cameraX, this.y);
    ctx.rotate(this.rotation);
    
    // Draw star shape
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * i) / 2;
      const length = this.size;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    ctx.stroke();
    
    // Draw sparkle center
    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    
    ctx.restore();
  }

  private getRandomRainbowColor(): string {
    const colors = [
      '#FF0000', // Red
      '#FF7F00', // Orange
      '#FFFF00', // Yellow
      '#00FF00', // Green
      '#0000FF', // Blue
      '#4B0082', // Indigo
      '#9400D3', // Violet
      '#FF69B4', // Hot Pink
      '#00FFFF', // Cyan
      '#FFD700'  // Gold
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getRandomHealColor(): string {
    const colors = [
      '#00FF00', // Bright green
      '#7FFF00', // Chartreuse
      '#98FB98', // Pale green
      '#32CD32', // Lime green
      '#00FA9A', // Medium spring green
      '#90EE90'  // Light green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  createExplosion(x: number, y: number, count: number = 50, type: 'small' | 'medium' | 'large' | 'heal' = 'medium') {
    // Create multiple layers of particles
    this.createParticleLayer(x, y, count * 0.4, type);   // 40% large particles
    this.createParticleLayer(x, y, count * 0.3, type);   // 30% medium particles
    this.createParticleLayer(x, y, count * 0.3, type);   // 30% small particles
    
    // Create an additional burst of particles in a circular pattern
    for (let i = 0; i < count/2; i++) {
      const angle = (Math.PI * 2 * i) / (count/2);
      const speed = 1 + Math.random() * 3;
      const distance = 20 + Math.random() * 20;
      
      this.particles.push(
        new Particle(
          x + Math.cos(angle) * distance,
          y + Math.sin(angle) * distance,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 2, // Add upward bias
          type
        )
      );
    }
  }

  private createParticleLayer(x: number, y: number, count: number, type: 'small' | 'medium' | 'large' | 'heal') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      this.particles.push(
        new Particle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 1, // Add slight upward bias
          type
        )
      );
    }
  }

  update() {
    this.particles = this.particles.filter(particle => particle.update());
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    ctx.lineWidth = 1;
    this.particles.forEach(particle => particle.draw(ctx, cameraX));
  }
} 