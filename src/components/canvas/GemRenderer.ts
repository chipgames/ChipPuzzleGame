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

    // 색상별 구분 패턴 추가
    this.renderColorPattern(gem.color, offset, size);

    // 하이라이트
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.roundRect(offset, offset, size, size * 0.4, size * 0.2);
    this.ctx.fill();

    // 색상별 테두리 (더 명확한 구분)
    this.ctx.strokeStyle = this.getBorderColor(gem.color);
    this.ctx.lineWidth = size * 0.06;
    this.roundRect(offset, offset, size, size, size * 0.2);
    this.ctx.stroke();
  }

  /**
   * 색상별 테두리 색상 반환
   */
  private getBorderColor(color: GemColor): string {
    const borderColors: Record<GemColor, string> = {
      red: "rgba(255, 71, 87, 0.8)",
      yellow: "rgba(255, 211, 42, 0.8)",
      blue: "rgba(55, 66, 250, 0.8)",
      green: "rgba(46, 213, 115, 0.8)",
      purple: "rgba(165, 94, 234, 0.8)",
      orange: "rgba(255, 99, 72, 0.8)",
    };
    return borderColors[color];
  }

  /**
   * 색상별 구분 패턴 렌더링
   */
  private renderColorPattern(color: GemColor, _offset: number, size: number) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.3;

    switch (color) {
      case "red":
        // 빨강: 중앙 원
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case "yellow":
        // 노랑: 별 모양
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.drawStar(0, 0, size * 0.08, size * 0.15, 5);
        this.ctx.fill();
        break;
      case "blue":
        // 파랑: 다이아몬드
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size * 0.15);
        this.ctx.lineTo(size * 0.15, 0);
        this.ctx.lineTo(0, size * 0.15);
        this.ctx.lineTo(-size * 0.15, 0);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      case "green":
        // 초록: 삼각형
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size * 0.15);
        this.ctx.lineTo(-size * 0.13, size * 0.1);
        this.ctx.lineTo(size * 0.13, size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      case "purple":
        // 보라: 사각형
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.fillRect(-size * 0.1, -size * 0.1, size * 0.2, size * 0.2);
        break;
      case "orange":
        // 주황: 육각형
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = Math.cos(angle) * size * 0.12;
          const y = Math.sin(angle) * size * 0.12;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
        break;
    }

    this.ctx.restore();
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

  private renderColorBomb(_gem: Gem) {
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

