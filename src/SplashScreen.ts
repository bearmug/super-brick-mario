export class SplashScreen {
  private textBounceOffset: number = 0;
  private textBounceSpeed: number = 0.005;
  private textBounceAmount: number = 10;

  constructor(private ctx: CanvasRenderingContext2D, private width: number, private height: number) {}

  draw() {
    // Background
    this.ctx.fillStyle = '#6B8CFF';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw stars behind everything
    this.drawPixelStars();

    // Title text with bounce effect
    this.textBounceOffset = Math.sin(Date.now() * this.textBounceSpeed) * this.textBounceAmount;
    
    // Draw title with shadow
    this.ctx.font = '72px "Press Start 2P"';
    this.ctx.textAlign = 'center';
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText('SUPER MARIO', this.width / 2 + 4, this.height / 3 + this.textBounceOffset + 4);
    
    // Main title
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText('SUPER MARIO', this.width / 2, this.height / 3 + this.textBounceOffset);

    // Controls container
    const containerWidth = 500;
    const containerHeight = 180;
    const containerX = (this.width - containerWidth) / 2;
    const containerY = this.height / 2 - 30;

    // Draw semi-transparent container background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(containerX, containerY, containerWidth, containerHeight);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(containerX, containerY, containerWidth, containerHeight);

    // Controls title
    this.ctx.font = '24px "Press Start 2P"';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONTROLS', this.width / 2, containerY + 40);

    // Draw controls with consistent spacing
    const startY = containerY + 80;
    const lineHeight = 45;
    
    this.drawControlLine('←→', 'MOVE', startY);
    this.drawControlLine('SPACE', 'JUMP', startY + lineHeight);
    this.drawControlLine('X + ←→', 'SLASH', startY + lineHeight * 2);
    
    // Start prompt with bounce effect
    const promptY = this.height - 80;
    const promptBounce = Math.sin(Date.now() * 0.003) * 5;
    
    this.ctx.font = '24px "Press Start 2P"';
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.textAlign = 'center';
    
    // Add text shadow for better visibility
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText('PRESS SPACE TO START', this.width / 2 + 2, promptY + promptBounce + 2);
    
    // Main text
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.fillText('PRESS SPACE TO START', this.width / 2, promptY + promptBounce);
  }

  private drawControlLine(key: string, action: string, y: number) {
    const centerX = this.width / 2;
    const keyBoxWidth = 140;
    const keyBoxHeight = 35;
    const spacing = 20;
    
    // Key box
    const keyX = centerX - 120 - keyBoxWidth / 2;
    
    // Box shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(keyX + 2, y - 22, keyBoxWidth, keyBoxHeight);
    
    // Main box
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(keyX, y - 24, keyBoxWidth, keyBoxHeight);
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(keyX, y - 24, keyBoxWidth, keyBoxHeight);
    
    // Key text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(key, keyX + keyBoxWidth / 2, y);
    
    // Action text
    this.ctx.textAlign = 'left';
    this.ctx.fillText(action, centerX + 40, y);
  }

  private drawPixelStars() {
    const starPositions = [
      { x: 100, y: 100 }, { x: 700, y: 150 },
      { x: 200, y: 500 }, { x: 600, y: 450 },
      { x: 150, y: 300 }, { x: 650, y: 350 }
    ];

    this.ctx.fillStyle = '#FFE5A9';
    starPositions.forEach(pos => {
      this.ctx.fillRect(pos.x, pos.y, 4, 4);
      this.ctx.fillRect(pos.x - 2, pos.y, 8, 2);
      this.ctx.fillRect(pos.x, pos.y - 2, 2, 8);
    });
  }
} 