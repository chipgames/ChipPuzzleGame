import { Gem, GemColor } from "@/types/gem";
import { GEM_COLOR_HEX } from "@/constants/gemConfig";

export class GemRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;

  constructor(ctx: CanvasRenderingContext2D, cellSize: number) {
    this.ctx = ctx;
    this.cellSize = cellSize;
  }

  public render(gem: Gem, alpha: number = 1) {
    this.ctx.save();

    // 위치 및 변환 적용
    const centerX = gem.x + this.cellSize / 2;
    const centerY = gem.y + this.cellSize / 2;
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(gem.scale || 1, gem.scale || 1);
    this.ctx.rotate(gem.rotation || 0);
    
    // 알파 적용 (페이드 효과)
    this.ctx.globalAlpha = alpha;

    // 젬 타입에 따른 렌더링
    switch (gem.type) {
      case "normal":
        this.renderNormalGem(gem);
        break;
      case "striped":
        this.renderStripedGem(gem);
        break;
      case "wrapped":
        this.renderWrappedGem(gem);
        break;
      case "colorBomb":
        this.renderColorBomb(gem);
        break;
    }

    this.ctx.restore();
  }

  private renderNormalGem(gem: Gem) {
    const colors = GEM_COLOR_HEX[gem.color];
    const size = this.cellSize * 0.85;
    const offset = -size / 2;

    // 그림자
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.roundRect(offset + 2, offset + 2, size, size, size * 0.2);
    this.ctx.fill();

    // 메인 젬
    const gradient = this.ctx.createLinearGradient(
      offset,
      offset,
      offset + size,
      offset + size
    );
    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(1, colors.dark);
    this.ctx.fillStyle = gradient;
    this.roundRect(offset, offset, size, size, size * 0.2);
    this.ctx.fill();

    // 하이라이트
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.roundRect(offset, offset, size, size * 0.4, size * 0.2);
    this.ctx.fill();
  }

  private renderStripedGem(gem: Gem) {
    const colors = GEM_COLOR_HEX[gem.color];
    const size = this.cellSize * 0.85;
    const offset = -size / 2;

    // 배경
    const gradient = this.ctx.createLinearGradient(
      offset,
      offset,
      offset + size,
      offset + size
    );
    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(1, colors.dark);
    this.ctx.fillStyle = gradient;
    this.roundRect(offset, offset, size, size, size * 0.2);
    this.ctx.fill();

    // 스트라이프 패턴
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    this.ctx.lineWidth = size * 0.1;
    this.ctx.lineCap = "round";

    if (gem.stripedDirection === "horizontal") {
      // 가로 스트라이프
      for (let i = 0; i < 3; i++) {
        const y = offset + (size / 4) * (i + 1);
        this.ctx.beginPath();
        this.ctx.moveTo(offset, y);
        this.ctx.lineTo(offset + size, y);
        this.ctx.stroke();
      }
    } else {
      // 세로 스트라이프
      for (let i = 0; i < 3; i++) {
        const x = offset + (size / 4) * (i + 1);
        this.ctx.beginPath();
        this.ctx.moveTo(x, offset);
        this.ctx.lineTo(x, offset + size);
        this.ctx.stroke();
      }
    }
  }

  private renderWrappedGem(gem: Gem) {
    const colors = GEM_COLOR_HEX[gem.color];
    const size = this.cellSize * 0.85;
    const offset = -size / 2;

    // 배경
    const gradient = this.ctx.createLinearGradient(
      offset,
      offset,
      offset + size,
      offset + size
    );
    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(1, colors.dark);
    this.ctx.fillStyle = gradient;
    this.roundRect(offset, offset, size, size, size * 0.2);
    this.ctx.fill();

    // 래핑 효과 (X 패턴)
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.lineWidth = size * 0.08;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(offset, offset);
    this.ctx.lineTo(offset + size, offset + size);
    this.ctx.moveTo(offset + size, offset);
    this.ctx.lineTo(offset, offset + size);
    this.ctx.stroke();
  }

  private renderColorBomb(gem: Gem) {
    const size = this.cellSize * 0.85;
    const offset = -size / 2;

    // 무지개 그라데이션
    const gradient = this.ctx.createLinearGradient(
      offset,
      offset,
      offset + size,
      offset + size
    );
    gradient.addColorStop(0, "#ff6b6b");
    gradient.addColorStop(0.2, "#ffd93d");
    gradient.addColorStop(0.4, "#4ecdc4");
    gradient.addColorStop(0.6, "#95e1d3");
    gradient.addColorStop(0.8, "#a29bfe");
    gradient.addColorStop(1, "#fd79a8");
    this.ctx.fillStyle = gradient;
    this.roundRect(offset, offset, size, size, size * 0.2);
    this.ctx.fill();

    // 별 모양
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.drawStar(0, 0, size * 0.3, size * 0.6, 5);
    this.ctx.fill();
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  private drawStar(x: number, y: number, innerRadius: number, outerRadius: number, points: number) {
    this.ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI * i) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
  }
}

