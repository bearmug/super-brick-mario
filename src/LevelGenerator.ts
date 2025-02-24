import { GameObject } from './types';

interface BlockTemplate {
  relativeX: number;
  y: number;
  width?: number;
  height?: number;
  type: 'ground' | 'pipe' | 'block' | 'question';
}

export class LevelGenerator {
  private lastGeneratedX: number = 0;
  private chunkSize: number = 800; // Generate in chunks of screen width
  private groundY: number;
  
  constructor(groundY: number) {
    this.groundY = groundY;
  }

  generateChunk(currentX: number): GameObject[] {
    const blocks: GameObject[] = [];
    
    // Only generate if we're close to the last generated position
    if (currentX + this.chunkSize > this.lastGeneratedX) {
      const startX = this.lastGeneratedX;
      const endX = startX + this.chunkSize;
      
      // Generate ground blocks
      for (let x = startX; x < endX; x += 32) {
        blocks.push({
          x,
          y: this.groundY,
          width: 32,
          height: 32
        });
      }

      // Generate random obstacles and platforms
      const templates = this.getRandomTemplates();
      templates.forEach(template => {
        const block: GameObject = {
          x: startX + template.relativeX,
          y: template.y,
          width: template.width || 32,
          height: template.height || 32
        };
        blocks.push(block);
      });

      this.lastGeneratedX = endX;
    }

    return blocks;
  }

  private getRandomTemplates(): BlockTemplate[] {
    const templates: BlockTemplate[] = [];
    const segmentWidth = this.chunkSize;
    
    // Add some random platforms
    const platformCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < platformCount; i++) {
      const platformLength = 1 + Math.floor(Math.random() * 3);
      const platformX = Math.random() * (segmentWidth - platformLength * 32);
      const platformY = this.groundY - 100 - Math.random() * 150;

      for (let j = 0; j < platformLength; j++) {
        templates.push({
          relativeX: platformX + j * 32,
          y: platformY,
          type: 'block'
        });
      }
    }

    // Add some pipes
    const pipeCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < pipeCount; i++) {
      const pipeX = Math.random() * (segmentWidth - 64);
      const pipeHeight = 64 + Math.floor(Math.random() * 64);
      templates.push({
        relativeX: pipeX,
        y: this.groundY - pipeHeight,
        width: 64,
        height: pipeHeight,
        type: 'pipe'
      });
    }

    // Add some question blocks
    const questionCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < questionCount; i++) {
      templates.push({
        relativeX: Math.random() * (segmentWidth - 32),
        y: this.groundY - 150 + Math.random() * 50,
        type: 'question'
      });
    }

    // Ensure no overlaps
    return this.removeOverlappingTemplates(templates);
  }

  private removeOverlappingTemplates(templates: BlockTemplate[]): BlockTemplate[] {
    return templates.filter((template, index) => {
      for (let i = 0; i < index; i++) {
        const other = templates[i];
        const xOverlap = Math.abs((template.relativeX + (template.width || 32)/2) - 
                                (other.relativeX + (other.width || 32)/2)) < 
                                ((template.width || 32) + (other.width || 32))/2;
        const yOverlap = Math.abs((template.y + (template.height || 32)/2) - 
                                (other.y + (other.height || 32)/2)) < 
                                ((template.height || 32) + (other.height || 32))/2;
        
        if (xOverlap && yOverlap) {
          return false;
        }
      }
      return true;
    });
  }
} 