import { GemColor } from "@/types/gem";
import { GEM_COLOR_HEX } from "@/constants/gemConfig";

/**
 * 파티클 인터페이스
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

/**
 * 파티클 시스템 클래스
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 파티클 생성
   */
  public emit(
    x: number,
    y: number,
    color: GemColor,
    count: number = 20
  ): void {
    const colors = GEM_COLOR_HEX[color];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? colors.light : colors.dark,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  /**
   * 폭발 효과 파티클 생성
   */
  public emitExplosion(
    x: number,
    y: number,
    color: GemColor,
    radius: number = 50,
    count: number = 30
  ): void {
    const colors = GEM_COLOR_HEX[color];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const speed = 1 + Math.random() * 2;
      
      this.particles.push({
        x: x + Math.cos(angle) * distance * 0.3,
        y: y + Math.sin(angle) * distance * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: Math.random() > 0.5 ? colors.light : colors.dark,
        size: 4 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  /**
   * 파티클 업데이트
   */
  public update(deltaTime: number = 16): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // 위치 업데이트
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // 중력 효과
      particle.vy += 0.1;
      
      // 감속
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // 회전
      particle.rotation += particle.rotationSpeed;
      
      // 생명력 감소
      particle.life -= deltaTime / 1000;
      
      // 생명력이 0 이하면 제거
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * 파티클 렌더링
   */
  public render(): void {
    this.ctx.save();
    
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);
      
      // 사각형 파티클
      this.ctx.fillRect(-size / 2, -size / 2, size, size);
      
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 리셋
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  /**
   * 모든 파티클 제거
   */
  public clear(): void {
    this.particles = [];
  }

  /**
   * 활성 파티클 수
   */
  public get count(): number {
    return this.particles.length;
  }
}

