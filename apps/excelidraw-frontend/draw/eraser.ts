import type { Shape, StoredShape } from "./Game";

export class Eraser {
  private size: number;

  constructor(size: number = 10) {
    this.size = size;
  }

  setSize(size: number) {
    this.size = size;
  }

  getSize() {
    return this.size;
  }

  private isPointInShape(x: number, y: number, shape: Shape): boolean {
    if (shape.type === "rect") {
      return x >= shape.x && x <= shape.x + shape.width &&
             y >= shape.y && y <= shape.y + shape.height;
    } else if (shape.type === "circle") {
      const dx = x - shape.centerX;
      const dy = y - shape.centerY;
      return Math.sqrt(dx * dx + dy * dy) <= Math.abs(shape.radius);
    } else if (shape.type === "pencil") {
      return shape.path.some(([px, py]) =>
        Math.hypot(px - x, py - y) <= (shape.strokeWidth || 2) + this.size
      );
    } else if (shape.type === "line" || shape.type === "arrow") {
      const dist = this.pointToLineDistance(
        { x, y },
        { x: shape.startX, y: shape.startY },
        { x: shape.endX, y: shape.endY }
      );
      return dist <= this.size + 3;
    } else if (shape.type === "diamond") {
      const dx = Math.abs(x - shape.centerX);
      const dy = Math.abs(y - shape.centerY);
      return (dx <= shape.width / 2 + this.size) && (dy <= shape.height / 2 + this.size);
    } else if (shape.type === "text") {
      return x >= shape.x && x <= shape.x + shape.width &&
             y >= shape.y && y <= shape.y + shape.height;
    }
    return false;
  }

  findShapeAt(x: number, y: number, storedShapes: StoredShape[]): string | null {
    for (let i = storedShapes.length - 1; i >= 0; i--) {
      const stored = storedShapes[i];
      if (this.isPointInShape(x, y, stored.shape)) {
        return stored.id;
      }
    }
    return null;
  }

  drawPreview(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }

  private pointToLineDistance(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
    const A = p.x - a.x;
    const B = p.y - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = a.x;
      yy = a.y;
    } else if (param > 1) {
      xx = b.x;
      yy = b.y;
    } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
