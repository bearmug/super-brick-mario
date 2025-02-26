import './style.css'
import { SplashScreen } from './SplashScreen'
import { Enemy } from './Enemy'
import { ParticleSystem } from './Particle'
import { GameObject } from './types'
import { LevelGenerator } from './LevelGenerator'
import { AudioManager } from './AudioManager'

class Mario implements GameObject {
  x: number = 50;
  y: number = 400;
  width: number = 32;
  height: number = 32;
  velocityY: number = 0;
  velocityX: number = 0;
  isJumping: boolean = false;
  speed: number = 5;
  jumpForce: number = -15;
  gravity: number = 0.8;
  health: number = 6; // 6 hits total (1 heart = 2 hits)
  isInvulnerable: boolean = false;
  invulnerabilityTime: number = 1500; // 1.5 seconds of invulnerability after hit
  lastHitTime: number = 0;
  slashEnergy: number = 0;
  maxSlashEnergy: number = 100;
  slashChargeRate: number = 0.2;
  isSlashing: boolean = false;
  slashVelocity: number = 25;
  slashDuration: number = 500;
  slashStartTime: number = 0;

  takeDamage(): boolean {
    const now = Date.now();
    if (!this.isInvulnerable) {
      this.health--;
      this.isInvulnerable = true;
      this.lastHitTime = now;
      
      // Random knockback direction
      const angle = Math.random() * Math.PI * 2;
      this.velocityX = Math.cos(angle) * 15;
      this.velocityY = Math.sin(angle) * 15 - 10; // Extra upward boost
      
      return true;
    }
    return false;
  }

  recoverHealth() {
    if (this.health < 6) {  // Only heal if not at max health
      this.health = Math.min(6, this.health + 1);
      return true;
    }
    return false;
  }

  update() {
    // Update invulnerability
    if (this.isInvulnerable && Date.now() - this.lastHitTime > this.invulnerabilityTime) {
      this.isInvulnerable = false;
    }

    // Charge slash energy
    if (!this.isSlashing && this.slashEnergy < this.maxSlashEnergy) {
      this.slashEnergy = Math.min(this.maxSlashEnergy, this.slashEnergy + this.slashChargeRate);
    }

    // Update slash state
    if (this.isSlashing && Date.now() - this.slashStartTime > this.slashDuration) {
      this.isSlashing = false;
      this.velocityX = 0;
    }
  }

  startSlash(direction: number) {
    if (this.slashEnergy >= this.maxSlashEnergy) {
      this.isSlashing = true;
      this.slashStartTime = Date.now();
      this.velocityX = direction * this.slashVelocity;
      this.slashEnergy = 0;
      return true;
    }
    return false;
  }
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private gameState: 'splash' | 'playing' = 'splash';
  private textBounceOffset: number = 0;
  private textBounceSpeed: number = 0.01;
  private textBounceAmount: number = 10;
  
  // Score tracking
  private currentScore: number = 0;
  private topScore: number = this.loadTopScore();
  
  // Game objects
  private mario: Mario;
  private cameraX: number = 0;
  private ground: number;
  private blocks: GameObject[] = [];
  private enemies: Enemy[] = [];
  private splashScreen: SplashScreen;
  private particleSystem: ParticleSystem;
  private lastEnemySpawn: number = 0;
  private enemySpawnInterval: number = 3000; // Spawn enemy every 3 seconds
  private levelGenerator: LevelGenerator;
  private maxEnemiesOnScreen: number = 3;
  private gameOver: boolean = false;
  private lastSlashBlinkTime: number = 0;
  private slashBlinkInterval: number = 200;
  private isSlashBarBlinking: boolean = false;
  private audioManager: AudioManager;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Set canvas size
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Initialize audio but don't start music yet
    this.audioManager = new AudioManager();
    
    // Initialize game objects
    this.mario = new Mario();
    this.ground = this.canvas.height - 100;
    this.levelGenerator = new LevelGenerator(this.ground);
    this.splashScreen = new SplashScreen(this.ctx, this.canvas.width, this.canvas.height);
    this.particleSystem = new ParticleSystem();
    
    // Add keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Start the game loop
    this.gameLoop();
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.gameState === 'splash' && event.code === 'Space') {
      this.gameState = 'playing';
      // Start music when game starts (after user interaction)
      console.log('Starting game music...');
      this.audioManager.startMusic();
      return;
    }

    if (this.gameState === 'playing' && this.gameOver && event.code === 'Space') {
      this.resetGame();
      return;
    }

    if (this.gameState === 'playing') {
      switch (event.code) {
        case 'ArrowRight':
          this.mario.velocityX = this.mario.speed;
          break;
        case 'ArrowLeft':
          this.mario.velocityX = -this.mario.speed;
          break;
        case 'Space':
          if (!this.mario.isJumping) {
            this.mario.velocityY = this.mario.jumpForce;
            this.mario.isJumping = true;
          }
          break;
        case 'KeyX':
          if (this.mario.velocityX !== 0) {
            if (this.mario.startSlash(Math.sign(this.mario.velocityX))) {
              this.isSlashBarBlinking = false;
            }
          }
          break;
      }
    }
  }

  private handleKeyUp = (event: KeyboardEvent) => {
    if (this.gameState === 'playing') {
      switch (event.code) {
        case 'ArrowRight':
        case 'ArrowLeft':
          this.mario.velocityX = 0;
          break;
      }
    }
  }

  private spawnEnemy() {
    const now = Date.now();
    const visibleEnemies = this.enemies.filter(enemy => 
      enemy.x >= this.cameraX && 
      enemy.x <= this.cameraX + this.canvas.width
    );

    if (now - this.lastEnemySpawn > this.enemySpawnInterval && 
        visibleEnemies.length < this.maxEnemiesOnScreen) {
      this.enemies.push(new Enemy(
        this.mario.x + this.canvas.width, // Spawn just off-screen to the right
        this.ground - 32 // Place on ground
      ));
      this.lastEnemySpawn = now;
    }
  }

  private loadTopScore(): number {
    const savedScore = localStorage.getItem('marioTopScore');
    return savedScore ? parseInt(savedScore) : 0;
  }

  private saveTopScore() {
    localStorage.setItem('marioTopScore', this.topScore.toString());
  }

  private updateScore() {
    this.currentScore++;
    if (this.currentScore > this.topScore) {
      this.topScore = this.currentScore;
      this.saveTopScore();
    }
  }

  private update() {
    if (this.gameState !== 'playing') return;

    // Update Mario's state first
    this.mario.update();

    // Generate new level chunks as needed
    const newBlocks = this.levelGenerator.generateChunk(this.mario.x);
    this.blocks.push(...newBlocks);

    // Remove blocks that are far behind
    this.blocks = this.blocks.filter(block => 
      block.x > this.mario.x - this.canvas.width
    );

    // Update camera position first
    this.cameraX = Math.max(0, this.mario.x - this.canvas.width / 3);

    // Spawn enemies
    this.spawnEnemy();

    // Store previous position for collision resolution
    const prevX = this.mario.x;
    const prevY = this.mario.y;

    // Update Mario's position
    this.mario.x += this.mario.velocityX;
    this.mario.y += this.mario.velocityY;
    this.mario.velocityY += this.mario.gravity;

    // Ground collision
    if (this.mario.y + this.mario.height > this.ground) {
      this.mario.y = this.ground - this.mario.height;
      this.mario.velocityY = 0;
      this.mario.isJumping = false;
    }

    // Block collisions for Mario
    this.blocks.forEach(block => {
      if (this.checkCollision(this.mario, block)) {
        // Vertical collision
        if (this.mario.velocityY > 0 && prevY + this.mario.height <= block.y) {
          // Landing on top of a block
          this.mario.y = block.y - this.mario.height;
          this.mario.velocityY = 0;
          this.mario.isJumping = false;
        } else if (this.mario.velocityY < 0 && prevY >= block.y + block.height) {
          // Hitting block from below
          this.mario.y = block.y + block.height;
          this.mario.velocityY = 0;
        }
        
        // Horizontal collision
        if (this.mario.velocityX > 0 && prevX + this.mario.width <= block.x) {
          // Collision from left
          this.mario.x = block.x - this.mario.width;
        } else if (this.mario.velocityX < 0 && prevX >= block.x + block.width) {
          // Collision from right
          this.mario.x = block.x + block.width;
        }
      }
    });

    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(this.blocks);
      
      if (!enemy.isDead && this.checkCollision(this.mario, enemy)) {
        if (this.mario.isSlashing) {
          // Instant kill with super slash
          enemy.isDead = true;
          this.updateScore();
          
          // Create super rainbow trail
          for (let i = 0; i < 2; i++) {
            this.particleSystem.createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              50
            );
          }

          // Heal if it's a special jumper
          if (enemy.isSpecialJumper && this.mario.recoverHealth()) {
            // Create healing effect
            for (let i = 0; i < 3; i++) {
              this.particleSystem.createExplosion(
                this.mario.x + this.mario.width / 2,
                this.mario.y + this.mario.height / 2,
                40,
                'heal'  // New particle type for healing
              );
            }
          }
        } else if (this.mario.velocityY > 0 && prevY + this.mario.height <= enemy.y) {
          // Normal jump kill
          enemy.isDead = true;
          this.mario.velocityY = this.mario.jumpForce * 0.7;
          
          if (enemy.isSpecialJumper && this.mario.recoverHealth()) {
            // Create healing effect
            for (let i = 0; i < 3; i++) {
              this.particleSystem.createExplosion(
                this.mario.x + this.mario.width / 2,
                this.mario.y + this.mario.height / 2,
                40,
                'heal'
              );
            }
          } else {
            // Normal defeat explosion
            this.particleSystem.createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2
            );
          }
          
          this.updateScore();
        } else {
          // Take damage
          if (this.mario.takeDamage()) {
            for (let i = 0; i < 3; i++) {
              this.particleSystem.createExplosion(
                this.mario.x + this.mario.width / 2,
                this.mario.y + this.mario.height / 2,
                100
              );
            }
            if (this.mario.health <= 0) {
              this.gameOver = true;
            }
          }
        }
      }
    });

    // Create rainbow trail during slash
    if (this.mario.isSlashing && Date.now() % 50 < 25) {
      this.particleSystem.createExplosion(
        this.mario.x + this.mario.width / 2,
        this.mario.y + this.mario.height / 2,
        30
      );
    }

    // Clean up dead enemies and enemies that are far behind
    this.enemies = this.enemies.filter(enemy => 
      !enemy.isDead && enemy.x > this.cameraX - this.canvas.width
    );

    // Update particles
    this.particleSystem.update();

    // Check if slash bar is full
    if (this.mario.slashEnergy >= this.mario.maxSlashEnergy && !this.isSlashBarBlinking) {
      this.isSlashBarBlinking = true;
      this.lastSlashBlinkTime = Date.now();
    }

    if (this.gameOver) {
      setTimeout(() => {
        this.resetGame();
      }, 2000);
    }
  }

  private checkCollision(a: GameObject, b: GameObject): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  private draw() {
    if (this.gameState !== 'playing') return;

    // Clear the canvas
    this.ctx.fillStyle = '#6B8CFF'; // Sky blue
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save the current state before any blur
    this.ctx.save();

    // Apply game over blur if needed
    if (this.gameOver) {
      this.ctx.filter = 'blur(4px)';
    }

    // Draw ground and blocks
    this.ctx.fillStyle = '#94552C'; // Brown
    this.blocks.forEach(block => {
      this.ctx.fillRect(
        block.x - this.cameraX,
        block.y,
        block.width,
        block.height
      );
    });

    // Draw enemies
    this.enemies.forEach(enemy => enemy.draw(this.ctx, this.cameraX));

    // Draw Mario
    this.ctx.fillStyle = this.mario.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0 
      ? 'rgba(255, 0, 0, 0.5)' 
      : 'red';
    this.ctx.fillRect(
      this.mario.x - this.cameraX,
      this.mario.y,
      this.mario.width,
      this.mario.height
    );

    // Draw particles
    this.particleSystem.draw(this.ctx, this.cameraX);

    // Draw score
    this.ctx.font = '24px "Press Start 2P"';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.currentScore}`, 20, 40);
    this.ctx.fillText(`TOP: ${this.topScore}`, 20, 80);

    // Add score shadow for better visibility
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText(`SCORE: ${this.currentScore}`, 22, 42);
    this.ctx.fillText(`TOP: ${this.topScore}`, 22, 82);

    // Draw hearts
    this.drawHearts();
    
    // Draw slash bar under hearts
    this.drawSlashBar();

    // Restore the state to remove blur for game over overlay
    if (this.gameOver) {
      this.ctx.restore();
      
      // Add dark overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw glowing game over text
      this.ctx.font = '72px "Press Start 2P"';
      this.ctx.textAlign = 'center';
      
      // Draw text shadow/glow
      const glowSize = 20;
      const glowSteps = 10;
      for (let i = 0; i < glowSteps; i++) {
        const alpha = (glowSteps - i) / (glowSteps * 2);
        const size = (glowSize * i) / glowSteps;
        this.ctx.shadowColor = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.shadowBlur = size;
        this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      }

      // Draw main text
      this.ctx.shadowColor = 'none';
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

      // Draw "Press SPACE to restart" with bounce effect
      this.ctx.font = '24px "Press Start 2P"';
      const bounceOffset = Math.sin(Date.now() * 0.005) * 5;
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(
        'Press SPACE to restart',
        this.canvas.width / 2,
        this.canvas.height / 2 + 100 + bounceOffset
      );
    }
  }

  private drawHearts() {
    const heartSize = 32;
    const spacing = 40;
    const startX = this.canvas.width - (spacing * 3 + 20);
    const y = 20;

    for (let i = 0; i < 3; i++) {
      // Calculate health for this heart (0 to 2 hits per heart)
      let healthForThisHeart = 0;
      const remainingHealth = Math.max(0, this.mario.health - (i * 2));
      
      if (remainingHealth >= 2) {
        healthForThisHeart = 2; // Full heart
      } else if (remainingHealth >= 1.5) {
        healthForThisHeart = 1.5; // Three quarters
      } else if (remainingHealth >= 1) {
        healthForThisHeart = 1; // Half heart
      } else if (remainingHealth >= 0.5) {
        healthForThisHeart = 0.5; // Quarter heart
      }
      
      this.drawHeart(startX + (spacing * i), y, heartSize, healthForThisHeart / 2);
    }
  }

  private drawHeart(x: number, y: number, size: number, health: number) {
    // Draw heart shape
    this.ctx.beginPath();
    this.ctx.moveTo(x + size/2, y + size/4);
    this.ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
    this.ctx.bezierCurveTo(x, y + size/2, x + size/2, y + size, x + size/2, y + size);
    this.ctx.bezierCurveTo(x + size/2, y + size, x + size, y + size/2, x + size, y + size/4);
    this.ctx.bezierCurveTo(x + size, y, x + size/2, y, x + size/2, y + size/4);
    this.ctx.closePath();
    
    // Fill based on health
    if (health === 0) {
      this.ctx.fillStyle = '#333333'; // Empty heart
    } else if (health === 0.25) {
      this.ctx.fillStyle = '#FF0000'; // Quarter heart
      this.ctx.globalAlpha = 0.25;
    } else if (health === 0.5) {
      this.ctx.fillStyle = '#FF0000'; // Half heart
      this.ctx.globalAlpha = 0.5;
    } else if (health === 0.75) {
      this.ctx.fillStyle = '#FF0000'; // Three quarters heart
      this.ctx.globalAlpha = 0.75;
    } else {
      this.ctx.fillStyle = '#FF0000'; // Full heart
      this.ctx.globalAlpha = 1;
    }
    this.ctx.fill();
    
    // Reset alpha for outline
    this.ctx.globalAlpha = 1;
    
    // Heart outline
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawSlashBar() {
    const barWidth = 120;
    const barHeight = 10;
    const x = this.canvas.width - (barWidth + 20);
    const y = 70;
    
    // Draw background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw fill
    const fillWidth = (this.mario.slashEnergy / this.mario.maxSlashEnergy) * barWidth;
    
    // Determine if bar should blink when full
    let shouldShowBar = true;
    if (this.isSlashBarBlinking && this.mario.slashEnergy >= this.mario.maxSlashEnergy) {
      shouldShowBar = Math.floor((Date.now() - this.lastSlashBlinkTime) / this.slashBlinkInterval) % 2 === 0;
    }
    
    if (shouldShowBar) {
      this.ctx.fillStyle = '#00FF00'; // Acid green
      this.ctx.fillRect(x, y, fillWidth, barHeight);
    }
    
    // Draw border
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, barWidth, barHeight);
  }

  private gameLoop = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameState === 'splash') {
      this.splashScreen.draw();
    } else {
      this.update();
      this.draw();
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  private resetGame() {
    // Stop the current music
    this.audioManager.stopMusic();
    
    // Reset game state
    this.gameState = 'splash';
    this.gameOver = false;
    this.currentScore = 0;
    this.cameraX = 0;

    // Reset Mario to initial position
    this.mario = new Mario();
    this.mario.x = 50;
    this.mario.y = this.ground - this.mario.height;

    // Clear entities
    this.enemies = [];
    this.blocks = [];
    
    // Reset level generator and generate initial landscape
    this.levelGenerator = new LevelGenerator(this.ground);
    const initialBlocks = this.levelGenerator.generateChunk(0);
    this.blocks.push(...initialBlocks);

    // Reset particle system
    this.particleSystem = new ParticleSystem();
    
    // Reset spawn timer
    this.lastEnemySpawn = 0;
  }
}

// Start the game when the page loads
new Game();
