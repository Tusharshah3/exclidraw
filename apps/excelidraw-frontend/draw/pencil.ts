// ---------- Point Utilities ----------
type GlobalPoint = [number, number];

function point(x: number, y: number): GlobalPoint {
  return [x, y];
}

function pointDistance(a: GlobalPoint, b: GlobalPoint): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

// ---------- Freehand Smoothing ----------
/**
 * Ramer–Douglas–Peucker algorithm for polyline simplification.
 * Keeps the shape while reducing noisy points.
 */
function simplifyRDP(points: GlobalPoint[], epsilon: number): GlobalPoint[] {
  if (points.length < 3) return points;

  const dmax = { dist: 0, index: 0 };

  const lineDistance = (p: GlobalPoint, a: GlobalPoint, b: GlobalPoint) => {
    const num = Math.abs(
      (b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])
    );
    const den = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return den === 0 ? pointDistance(p, a) : num / den;
  };

  for (let i = 1; i < points.length - 1; i++) {
    const d = lineDistance(points[i], points[0], points[points.length - 1]);
    if (d > dmax.dist) {
      dmax.dist = d;
      dmax.index = i;
    }
  }

  if (dmax.dist > epsilon) {
    const rec1 = simplifyRDP(points.slice(0, dmax.index + 1), epsilon);
    const rec2 = simplifyRDP(points.slice(dmax.index), epsilon);
    return rec1.slice(0, -1).concat(rec2);
  } else {
    return [points[0], points[points.length - 1]];
  }
}

// ---------- Pencil Tool with Freehand smoothing ----------
export class Pencil {
  private points: GlobalPoint[] = [];
  private smoothedPath: GlobalPoint[] = [];
  private strokeWidth: number;
  private strokeColor: string;
  constructor(strokeWidth: number = 2, strokeColor: string = "white") {
    this.strokeWidth = strokeWidth;
    this.strokeColor = strokeColor;
  } 

  addPoint(x: number, y: number) {
    const pt = point(x, y);
    if (
      this.points.length === 0 ||
      pointDistance(this.points[this.points.length - 1], pt) > 1
    ) {
      this.points.push(pt);
      this.updatePath();
    }
  }

  private updatePath() {
    if (this.points.length < 2) return;
    this.smoothedPath = simplifyRDP(this.points, 1.5);
  }

  getRawPoints() {
    return this.points;
  }

  getPath() {
    return this.smoothedPath;
  }

  reset() {
    this.points = [];
    this.smoothedPath = [];
  }
  setStrokeWidth(width: number) {
    this.strokeWidth = width;
  }

  setStrokeColor(color: string) {
    this.strokeColor = color;
  }
  getStrokeWidth() {
    return this.strokeWidth;
  }

  getStrokeColor() {
    return this.strokeColor;
  }
  draw(ctx: CanvasRenderingContext2D) {
    if (this.smoothedPath.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.smoothedPath[0][0], this.smoothedPath[0][1]);

    for (let i = 1; i < this.smoothedPath.length; i++) {
      ctx.lineTo(this.smoothedPath[i][0], this.smoothedPath[i][1]);
    }

    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();
  }

  
}
