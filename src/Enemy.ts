import { GameObject } from './types';

export class Enemy implements GameObject {
  public width: number = 32;
  public height: number = 32;
  public velocityX: number = -2;
  public velocityY: number = 0;
  public isDead: boolean = false;
  public isSpecialJumper: boolean;
  private gravity: number = 0.5;
  private jumpForce: number = -8;
  private isJumping: boolean = false;
  private jumpProbability: number = 0.02; // 2% chance to jump each update
  private turnProbability: number = 0.6; // 60% chance to turn around at obstacles
  private color: string;
  private lastJumpTime: number = 0;
  private minGroundTime: number = 1000; // Minimum time to stay on ground (in ms)

  constructor(public x: number, public y: number) {
    // 1 in 10 chance to be a special jumper
    this.isSpecialJumper = Math.random() < 0.1;
    if (this.isSpecialJumper) {
      this.jumpForce = -15; // Reduced from -20 to make it less extreme
      this.jumpProbability = 0.015; // Reduced from 0.05 to make jumps less frequent
      this.minGroundTime = 1500; // Special jumpers stay on ground longer
      this.color = '#FF00FF'; // Magenta color for special jumpers
    } else {
      this.color = '#8B0000'; // Dark red for normal enemies
    }
  }

  update(blocks: GameObject[]) {
    if (this.isDead) return;

    // Apply gravity
    this.velocityY += this.gravity;
    
    // Store previous position for collision resolution
    const prevX = this.x;
    const prevY = this.y;

    // Try horizontal movement first
    this.x += this.velocityX;
    
    // Check horizontal collisions
    let hasHorizontalCollision = false;
    blocks.forEach(block => {
      if (this.checkCollision(this, block)) {
        hasHorizontalCollision = true;
        // Revert to previous X position
        this.x = prevX;
        
        if (Math.random() < this.turnProbability) {
          // Turn around
          this.velocityX = -this.velocityX;
        } else if (!this.isJumping) {
          // Jump over obstacle
          this.tryJump();
        }
      }
    });

    // Then try vertical movement
    this.y += this.velocityY;

    // Check vertical collisions
    let isOnGround = false;
    blocks.forEach(block => {
      if (this.checkCollision(this, block)) {
        // Falling collision (landing)
        if (this.velocityY > 0 && prevY + this.height <= block.y + 5) { // Small tolerance for better ground detection
          this.y = block.y - this.height;
          this.velocityY = 0;
          this.isJumping = false;
          isOnGround = true;

          // Random chance to jump when on ground and enough time has passed
          const now = Date.now();
          if (!hasHorizontalCollision && 
              now - this.lastJumpTime > this.minGroundTime && 
              Math.random() < this.jumpProbability) {
            this.tryJump();
          }
        }
        // Rising collision (hitting ceiling)
        else if (this.velocityY < 0 && prevY >= block.y + block.height - 5) {
          this.y = block.y + block.height;
          this.velocityY = 0;
        }
        // Side collision while in air
        else {
          this.y = prevY;
          if (this.velocityY > 0) {
            this.isJumping = false;
          }
        }
      }
    });

    // Check if about to walk off platform
    if (!this.isJumping && !hasHorizontalCollision) {
      const groundCheck = {
        x: this.x + (this.velocityX > 0 ? this.width : -this.width),
        y: this.y + this.height + 5,
        width: 1,
        height: 1
      };

      let hasGroundAhead = false;
      blocks.forEach(block => {
        if (this.checkCollision(groundCheck, block)) {
          hasGroundAhead = true;
        }
      });

      if (!hasGroundAhead) {
        // Turn around if no ground ahead
        this.velocityX = -this.velocityX;
      }
    }
  }

  private tryJump() {
    if (!this.isJumping) {
      this.lastJumpTime = Date.now();
      this.velocityY = this.jumpForce;
      this.isJumping = true;
    }
  }

  private checkCollision(a: GameObject, b: GameObject): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number) {
    if (!this.isDead) {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.x - cameraX,
        this.y,
        this.width,
        this.height
      );

      // Draw direction indicator
      ctx.fillStyle = this.velocityX > 0 ? '#FFF' : '#000';
      ctx.fillRect(
        this.x - cameraX + (this.velocityX > 0 ? this.width - 8 : 0),
        this.y + 8,
        8,
        8
      );

      // Draw jump indicator for special jumpers
      if (this.isSpecialJumper) {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(this.x - cameraX + this.width/2, this.y);
        ctx.lineTo(this.x - cameraX + this.width/2 - 5, this.y - 8);
        ctx.lineTo(this.x - cameraX + this.width/2 + 5, this.y - 8);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
} 