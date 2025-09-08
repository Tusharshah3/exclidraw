// Game.ts (updated: strokeColor/strokeWidth across shapes; rounded diamond)
import { Tools } from "@/draw/tools";
import { getExistingShapes } from "./http";
import { Pencil } from "./pencil";
import { Eraser } from "./eraser";

type Tool = Tools;

export type Shape =
  | { type: "rect"; x: number; y: number; width: number; height: number; strokeWidth?: number; strokeColor?: string }
  | { type: "circle"; centerX: number; centerY: number; radius: number; strokeWidth?: number; strokeColor?: string }
  | { type: "pencil"; path: [number, number][]; strokeWidth: number; strokeColor: string }
  | { type: "line"; startX: number; startY: number; endX: number; endY: number; strokeWidth?: number; strokeColor?: string }
  | { type: "arrow"; startX: number; startY: number; endX: number; endY: number; strokeWidth?: number; strokeColor?: string }
  | { type: "diamond"; centerX: number; centerY: number; width: number; height: number; strokeWidth?: number; strokeColor?: string; cornerRadius?: number }
  | { type: "text"; x: number; y: number; width: number; height: number; text: string; strokeWidth?: number; strokeColor?: string };

export type StoredShape = { id: string; shape: Shape };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: StoredShape[] = [];
  private roomId: string;
  private clicked: boolean = false;
  private startX = 0; // world coords for drag shapes
  private startY = 0;
  private selectedTool: Tool = "circle";
  private defaultStrokeWidth = 2;
  private defaultStrokeColor = "white";
  private activePencil: Pencil | null = null;
  private activeEraser: Eraser | null = null;

  // CAMERA
  private cameraX = 0;
  private cameraY = 0;
  private zoom = 1;
  private isPanning = false;
  private panStart = { x: 0, y: 0 }; // screen coords
  private cameraStart = { x: 0, y: 0 };
  private spacePressed = false;

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
    this.socket = socket;

    // bind handlers
    this.init();
    this.initHandlers();
    this.initMouseHandlers();

    // keyboard for space-to-pan
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
  }

  keyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      this.spacePressed = true;
    }
  };

  keyUp = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      this.spacePressed = false;
    }
  };

  setTool(tool: Tools) {
    this.selectedTool = tool;
  }

  setStrokeWidth(width: number) {
    this.defaultStrokeWidth = width;
    if (this.activePencil) this.activePencil.setStrokeWidth(width);
  }

  setStrokeColor(color: string) {
    this.defaultStrokeColor = color;
    if (this.activePencil) this.activePencil.setStrokeColor(color);
  }

  async init() {
    // getExistingShapes returns StoredShape[]
    try {
      this.existingShapes = await getExistingShapes(this.roomId);
    } catch (e) {
      console.error("[Game] getExistingShapes failed:", e);
      this.existingShapes = [];
    }
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // server will broadcast { type: "chat", id, shape, roomId }
      if (message.type === "chat") {
        const serverId: string = message.id;
        const serverShape: Shape = message.shape;

        // try to find matching pending shape (deep equality)
        const serialized = JSON.stringify(serverShape);
        let replaced = false;
        for (let i = 0; i < this.existingShapes.length; i++) {
          const s = this.existingShapes[i];
          if (s.id && s.id.startsWith("pending-") && JSON.stringify(s.shape) === serialized) {
            this.existingShapes[i] = { id: serverId, shape: serverShape };
            replaced = true;
            break;
          }
        }
        if (!replaced) {
          // other user created shape
          this.existingShapes.push({ id: serverId, shape: serverShape });
        }
        this.clearCanvas();
      }

      // delete broadcast: { type: "delete", id, roomId }
      if (message.type === "delete") {
        const deletedId: string = message.id;
        this.existingShapes = this.existingShapes.filter((s) => s.id !== deletedId);
        this.clearCanvas();
      }
    };
  }

  // ---- CAMERA / TRANSFORMS ----
  setCamera(x: number, y: number) {
    this.cameraX = x;
    this.cameraY = y;
    this.clearCanvas();
  }

  panBy(dxScreen: number, dyScreen: number) {
    this.cameraX -= dxScreen / this.zoom;
    this.cameraY -= dyScreen / this.zoom;
    this.clearCanvas();
  }

  setZoom(newZoom: number, screenX?: number, screenY?: number) {
    const minZ = 0.1,
      maxZ = 8;
    newZoom = Math.max(minZ, Math.min(maxZ, newZoom));
    if (screenX != null && screenY != null) {
      const worldBefore = this.screenToWorld(screenX, screenY);
      this.zoom = newZoom;
      const worldAfter = this.screenToWorld(screenX, screenY);
      this.cameraX += worldBefore.x - worldAfter.x;
      this.cameraY += worldBefore.y - worldAfter.y;
    } else {
      this.zoom = newZoom;
    }
    this.clearCanvas();
  }

  getZoom() {
    return this.zoom;
  }

  resetCamera() {
    this.cameraX = 0;
    this.cameraY = 0;
    this.zoom = 1;
    this.clearCanvas();
  }

  // screen coords = pixels relative to canvas (top-left)
  private getCanvasScreenCoords(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  }

  // convert screen to world coordinates
  private screenToWorld(sx: number, sy: number) {
    return {
      x: sx / this.zoom + this.cameraX,
      y: sy / this.zoom + this.cameraY,
    };
  }

  private worldToScreen(wx: number, wy: number) {
    return {
      x: (wx - this.cameraX) * this.zoom,
      y: (wy - this.cameraY) * this.zoom,
    };
  }

  // helper to pick stroke/color with fallback
  private getStrokeWidthFor(shape: Partial<Shape>) {
    // shape may have strokeWidth property
    // @ts-ignore
    return (shape && (shape.strokeWidth ?? this.defaultStrokeWidth)) as number;
  }
  private getStrokeColorFor(shape: Partial<Shape>) {
    // @ts-ignore
    return (shape && (shape.strokeColor ?? this.defaultStrokeColor)) as string;
  }

  // rounded diamond drawing helper (world coords). cornerRadius in world units.
  private drawRoundedDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, cornerRadius: number) {
    // diamond vertices (top, right, bottom, left)
    const top = { x: cx, y: cy - h / 2 };
    const right = { x: cx + w / 2, y: cy };
    const bottom = { x: cx, y: cy + h / 2 };
    const left = { x: cx - w / 2, y: cy };

    // clamp cornerRadius so it doesn't overlap edges
    const maxR = Math.min(w, h) / 2;
    const r = Math.min(Math.max(0, cornerRadius || 6), maxR);

    ctx.beginPath();
    // move near top vertex but offset downward by r along the edge to left vertex
    // edge vectors: top->right, right->bottom, bottom->left, left->top
    // We'll use quadratic curves between offset points around each corner

    // compute offset points along each edge
    const offset = (a: { x: number; y: number }, b: { x: number; y: number }, rlen: number) => {
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const len = Math.hypot(vx, vy);
      if (len === 0) return { x: a.x, y: a.y };
      const ux = vx / len;
      const uy = vy / len;
      return { x: a.x + ux * rlen, y: a.y + uy * rlen };
    };

    const p1 = offset(top, right, r);
    const p2 = offset(right, bottom, r);
    const p3 = offset(bottom, left, r);
    const p4 = offset(left, top, r);

    // start at p1
    ctx.moveTo(p1.x, p1.y);
    // curve to p2 around right vertex using right as control point
    ctx.quadraticCurveTo(right.x, right.y, p2.x, p2.y);
    ctx.quadraticCurveTo(bottom.x, bottom.y, p3.x, p3.y);
    ctx.quadraticCurveTo(left.x, left.y, p4.x, p4.y);
    ctx.quadraticCurveTo(top.x, top.y, p1.x, p1.y);
    ctx.closePath();
    ctx.stroke();
  }

  // ---- DRAWING ----
  clearCanvas() {
    // save so we can restore for screen overlays
    this.ctx.save();

    // clear and background (draw in screen space)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply world transform: scale then translate world -> screen
    // screen = (world - camera) * zoom
    this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);

    // Draw each stored shape (in world coords)
    this.existingShapes.forEach(({ shape }) => {
      if (!shape) return;

      // common stroke props
      const strokeColor = this.getStrokeColorFor(shape);
      const strokeWidth = this.getStrokeWidthFor(shape);

      if (shape.type === "rect") {
        this.ctx.beginPath();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        this.ctx.closePath();
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        this.ctx.beginPath();
        if (shape.path.length > 0) {
          this.ctx.moveTo(shape.path[0][0], shape.path[0][1]);
          for (let i = 1; i < shape.path.length; i++) {
            this.ctx.lineTo(shape.path[i][0], shape.path[i][1]);
          }
        }
        this.ctx.strokeStyle = shape.strokeColor;
        this.ctx.lineWidth = shape.strokeWidth;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "line") {
        this.ctx.beginPath();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "arrow") {
        const headlen = 15;
        const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
        this.ctx.beginPath();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();

        // Arrowhead (scaled by world units — headlen in world units)
        this.ctx.beginPath();
        this.ctx.moveTo(shape.endX, shape.endY);
        this.ctx.lineTo(
          shape.endX - headlen * Math.cos(angle - Math.PI / 6),
          shape.endY - headlen * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
          shape.endX - headlen * Math.cos(angle + Math.PI / 6),
          shape.endY - headlen * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "diamond") {
        this.ctx.beginPath();
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        // support optional cornerRadius on diamond (in world units)
        const cornerRadius = (shape.cornerRadius ?? Math.min(shape.width, shape.height) * 0.08);
        this.drawRoundedDiamond(this.ctx, shape.centerX, shape.centerY, shape.width, shape.height, cornerRadius);
        // drawRoundedDiamond already strokes using current stroke settings
      } else if (shape.type === "text") {
        // text: draw in screen coords for consistent font size
        const screen = this.worldToScreen(shape.x, shape.y);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.font = `16px Arial`;
        this.ctx.fillStyle = strokeColor || "white";
        this.ctx.fillText(shape.text, screen.x, screen.y + 24);
        // reapply transform
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);
      }
    });

    // restore so any overlay previews (eraser circle drawn in screen coords) can be drawn by caller
    this.ctx.restore();
  }

  // ---- MOUSE HANDLING ----

  //@ts-ignore
  mouseDownHandler = (ev: MouseEvent) => {
    // compute screen and world coords
    const screen = this.getCanvasScreenCoords(ev);
    const world = this.screenToWorld(screen.x, screen.y);

    // detect panning (middle button or space)
    if (ev.button === 1 || this.spacePressed) {
      this.isPanning = true;
      this.panStart = { x: screen.x, y: screen.y };
      this.cameraStart = { x: this.cameraX, y: this.cameraY };
      return;
    }

    this.clicked = true;
    this.startX = world.x;
    this.startY = world.y;

    // start tools
    if (this.selectedTool === "pencil") {
      this.activePencil = new Pencil(this.defaultStrokeWidth, this.defaultStrokeColor);
      this.activePencil.addPoint(world.x, world.y);
      return;
    }

    if (this.selectedTool === "eraser") {
      if (!this.activeEraser) this.activeEraser = new Eraser(10);
      const shapeId = this.activeEraser.findShapeAt(world.x, world.y, this.existingShapes);
      if (shapeId) {
        // local removal and server notify
        this.existingShapes = this.existingShapes.filter((s) => s.id !== shapeId);

        this.socket.send(
          JSON.stringify({
            type: "delete",
            id: shapeId,
            roomId: this.roomId,
          })
        );

        this.clearCanvas();
      }
      return;
    }

    // other tool starts just set startX/startY and wait for mousemove/mouseup previews
  };

  //@ts-ignore
  mouseUpHandler = (ev: MouseEvent) => {
    // if we were panning, stop it
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    const screen = this.getCanvasScreenCoords(ev);
    const world = this.screenToWorld(screen.x, screen.y);

    this.clicked = false;

    // finalize pencil
    if (this.selectedTool === "pencil" && this.activePencil) {
      const shape: Shape = {
        type: "pencil",
        path: this.activePencil.getPath(),
        strokeWidth: this.activePencil.getStrokeWidth(),
        strokeColor: this.activePencil.getStrokeColor(),
      };

      // show pending immediately
      const pendingId = `pending-${Date.now()}`;
      this.existingShapes.push({ id: pendingId, shape });
      this.clearCanvas();

      // notify server; server will assign id and broadcast back
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId,
        })
      );

      this.activePencil = null;
      return;
    }

    // finalize drag-based shapes (rect,circle,line,arrow,diamond,text)
    const width = world.x - this.startX;
    const height = world.y - this.startY;
    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;

    const strokeWidth = this.defaultStrokeWidth;
    const strokeColor = this.defaultStrokeColor;

    if (selectedTool === "rect") {
      shape = { type: "rect", x: this.startX, y: this.startY, width, height, strokeWidth, strokeColor };
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(width * width + height * height) / 2;
      shape = {
        type: "circle",
        radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
        strokeWidth,
        strokeColor,
      };
    } else if (selectedTool === "line") {
      shape = { type: "line", startX: this.startX, startY: this.startY, endX: world.x, endY: world.y, strokeWidth, strokeColor };
    } else if (selectedTool === "arrow") {
      shape = { type: "arrow", startX: this.startX, startY: this.startY, endX: world.x, endY: world.y, strokeWidth, strokeColor };
    } else if (selectedTool === "diamond") {
      const centerX = this.startX + width / 2;
      const centerY = this.startY + height / 2;
      // cornerRadius optional -> make it relative to smaller dimension so it looks good
      const cornerRadius = Math.min(Math.abs(width), Math.abs(height)) * 0.08 || 6;
      shape = { type: "diamond", centerX, centerY, width: Math.abs(width), height: Math.abs(height), strokeWidth, strokeColor, cornerRadius };
    } else if (selectedTool === "text") {
      shape = { type: "text", x: this.startX, y: this.startY, width: Math.abs(width), height: Math.abs(height), text: "", strokeWidth, strokeColor };

      const input = document.createElement("textarea");
      const screenPos = this.worldToScreen(this.startX, this.startY);
      input.style.position = "absolute";
      input.style.left = `${screenPos.x}px`;
      input.style.top = `${screenPos.y}px`;
      input.style.width = `${Math.abs(width) * this.zoom}px`;
      input.style.height = `${Math.abs(height) * this.zoom}px`;
      input.style.font = "16px Arial";
      input.style.color = strokeColor;
      input.style.background = "transparent";
      input.style.border = "1px dashed white";
      input.style.outline = "none";
      input.style.resize = "none";

      document.body.appendChild(input);
      input.focus();

      input.addEventListener("blur", () => {
        // @ts-ignore
        shape!.text = input.value;
        const pendingId = `pending-${Date.now()}`;
        this.existingShapes.push({ id: pendingId, shape: shape! });
        this.clearCanvas();

        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId,
          })
        );

        document.body.removeChild(input);
      });
    }

    if (!shape) {
      return;
    }

    const pendingId = `pending-${Date.now()}`;
    this.existingShapes.push({ id: pendingId, shape });
    this.clearCanvas();

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      })
    );
  };

  //@ts-ignore
  mouseMoveHandler = (ev: MouseEvent) => {
    const screen = this.getCanvasScreenCoords(ev);
    const world = this.screenToWorld(screen.x, screen.y);

    // panning
    if (this.isPanning) {
      const dx = screen.x - this.panStart.x;
      const dy = screen.y - this.panStart.y;
      this.cameraX = this.cameraStart.x - dx / this.zoom;
      this.cameraY = this.cameraStart.y - dy / this.zoom;
      this.clearCanvas();
      // draw eraser preview in screen coords if eraser active
      if (this.selectedTool === "eraser" && this.activeEraser) {
        this.activeEraser.drawPreview(this.ctx, screen.x, screen.y);
      }
      return;
    }

    if (this.selectedTool === "pencil" && this.activePencil && this.clicked) {
      this.activePencil.addPoint(world.x, world.y);
      // Draw: clear + all stored shapes + current pencil on top
      this.clearCanvas();

      // draw active pencil in world coords: reuse pencil.draw but pencil.draw expects ctx in world coords
      this.activePencil.draw(this.ctx);
      return;
    }

    if (this.selectedTool === "eraser") {
      // preview eraser circle in screen coords (so it's not scaled by zoom)
      this.clearCanvas();
      if (!this.activeEraser) this.activeEraser = new Eraser(10);
      this.activeEraser.drawPreview(this.ctx, screen.x, screen.y);
      return;
    }

    // if dragging a shape for preview (rect/circle/line/arrow/diamond)
    if (this.clicked) {
      this.clearCanvas();
      // preview overlay in world coords: draw preview shapes transformed via clearCanvas's transform
      if (this.selectedTool === "rect") {
        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);
        this.ctx.strokeStyle = this.defaultStrokeColor;
        this.ctx.lineWidth = this.defaultStrokeWidth;
        this.ctx.strokeRect(this.startX, this.startY, world.x - this.startX, world.y - this.startY);
        this.ctx.restore();
      } else if (this.selectedTool === "circle") {
        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);
        const width = world.x - this.startX;
        const height = world.y - this.startY;
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.strokeStyle = this.defaultStrokeColor;
        this.ctx.lineWidth = this.defaultStrokeWidth;
        this.ctx.stroke();
        this.ctx.restore();
      } else if (this.selectedTool === "line") {
        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(world.x, world.y);
        this.ctx.strokeStyle = this.defaultStrokeColor;
        this.ctx.lineWidth = this.defaultStrokeWidth;
        this.ctx.stroke();
        this.ctx.restore();
      } else if (this.selectedTool === "arrow") {
        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);
        const headlen = 15;
        const dx = world.x - this.startX;
        const dy = world.y - this.startY;
        const angle = Math.atan2(dy, dx);
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(world.x, world.y);
        this.ctx.strokeStyle = this.defaultStrokeColor;
        this.ctx.lineWidth = this.defaultStrokeWidth;
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(world.x, world.y);
        this.ctx.lineTo(world.x - headlen * Math.cos(angle - Math.PI / 6), world.y - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(world.x - headlen * Math.cos(angle + Math.PI / 6), world.y - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.lineTo(world.x, world.y);
        this.ctx.stroke();
        this.ctx.restore();
      } else if (this.selectedTool === "diamond") {
        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, -this.cameraX * this.zoom, -this.cameraY * this.zoom);
        const width = world.x - this.startX;
        const height = world.y - this.startY;
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        const cornerRadius = Math.min(Math.abs(width), Math.abs(height)) * 0.08 || 6;
        this.ctx.strokeStyle = this.defaultStrokeColor;
        this.ctx.lineWidth = this.defaultStrokeWidth;
        this.drawRoundedDiamond(this.ctx, centerX, centerY, Math.abs(width), Math.abs(height), cornerRadius);
        this.ctx.restore();
      }
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);

    // wheel for zoom (cursor-focused)
    this.canvas.addEventListener(
      "wheel",
      (ev: WheelEvent) => {
        ev.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;
        const delta = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
        this.setZoom(this.zoom * delta, cx, cy);
      },
      { passive: false }
    );
  }
}
