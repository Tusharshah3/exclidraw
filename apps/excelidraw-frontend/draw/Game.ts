import { Tools } from "@/draw/tools";
import { getExistingShapes } from "./http";
import { Pencil } from "./pencil";
import { Eraser } from "./eraser";

type Tool = Tools;

export type Shape =
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "pencil"; path: [number, number][]; strokeWidth: number; strokeColor: string }
  | { type: "line"; startX: number; startY: number; endX: number; endY: number }
  | { type: "arrow"; startX: number; startY: number; endX: number; endY: number }
  | { type: "diamond"; centerX: number; centerY: number; width: number; height: number }
  | { type: "text"; x: number; y: number; width: number; height: number; text: string };

export type StoredShape = { id: string; shape: Shape };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: StoredShape[];
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private defaultStrokeWidth = 2;
  private defaultStrokeColor = "white";
  private activePencil: Pencil | null = null;
  private activeEraser: Eraser | null = null;

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  setTool(tool: Tools) {
    this.selectedTool = tool;
  }

  async init() {
    // getExistingShapes now returns StoredShape[]
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // server broadcasts a saved shape: { type: "chat", id, shape, roomId }
      if (message.type === "chat") {
        const serverId: string = message.id;
        const serverShape: Shape = message.shape;

        // replace any matching pending shape (by deep-equality) OR just push if none
        const serialized = JSON.stringify(serverShape);
        let replaced = false;

        // find a pending entry (id startsWith 'pending-') with identical shape body
        for (let i = 0; i < this.existingShapes.length; i++) {
          const s = this.existingShapes[i];
          if (s.id.startsWith("pending-") && JSON.stringify(s.shape) === serialized) {
            // replace the pending entry with the server-provided one
            this.existingShapes[i] = { id: serverId, shape: serverShape };
            replaced = true;
            break;
          }
        }

        if (!replaced) {
          // no pending match — just push (someone else created)
          this.existingShapes.push({ id: serverId, shape: serverShape });
        }

        this.clearCanvas();
      }

      // server broadcasts delete: { type: "delete", id, roomId }
      if (message.type === "delete") {
        const deletedId: string = message.id;
        this.existingShapes = this.existingShapes.filter((s) => s.id !== deletedId);
        this.clearCanvas();
      }
    };
  }

  clearCanvas() {
    // full redraw
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // background
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // draw stored shapes
    this.existingShapes.forEach(({ shape }) => {
      if (!shape) return;
      if (shape.type === "rect") {
        this.ctx.strokeStyle = "white";
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
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
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "arrow") {
        const headlen = 15;
        const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);

        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();

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
        const cx = shape.centerX;
        const cy = shape.centerY;
        const w = shape.width / 2;
        const h = shape.height / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - h);
        this.ctx.lineTo(cx + w, cy);
        this.ctx.lineTo(cx, cy + h);
        this.ctx.lineTo(cx - w, cy);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (shape.type === "text") {
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "white";
        this.ctx.fillText(shape.text, shape.x, shape.y + 24);
      }
    });
  }

  // convert window mouse event to canvas-local coordinates (handles CSS/scroll)
  private getCanvasCoords(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  }

  //@ts-ignore
  mouseDownHandler = (e: MouseEvent) => {
    this.clicked = true;
    const { x, y } = this.getCanvasCoords(e as MouseEvent);
    this.startX = x;
    this.startY = y;

    if (this.selectedTool === "pencil") {
      this.activePencil = new Pencil(this.defaultStrokeWidth, this.defaultStrokeColor);
      this.activePencil.addPoint(x, y);
      return;
    }

    if (this.selectedTool === "eraser") {
      if (!this.activeEraser) this.activeEraser = new Eraser(10);
      const shapeId = this.activeEraser.findShapeAt(x, y, this.existingShapes);
      if (shapeId) {
        // remove locally and notify server
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

    // For drag-based shapes (rect / circle / line / diamond / arrow / text),
    // we start a drag here and finalize on mouseup (handled in mouseUpHandler)
  };

  //@ts-ignore
  mouseUpHandler = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoords(e as MouseEvent);
    this.clicked = false;

    // finalize pencil
    if (this.selectedTool === "pencil" && this.activePencil) {
      const shape: Shape = {
        type: "pencil",
        path: this.activePencil.getPath(),
        strokeWidth: this.activePencil.getStrokeWidth(),
        strokeColor: this.activePencil.getStrokeColor(),
      };

      // create a pending local entry so user sees it immediately
      const pendingId = `pending-${Date.now()}`;
      this.existingShapes.push({ id: pendingId, shape });
      this.clearCanvas();

      // send to server; server will respond with real id and message.shape
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

    // finalize rectangle/circle/line/arrow/diamond/text using startX/startY and x,y
    const width = x - this.startX;
    const height = y - this.startY;
    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;

    if (selectedTool === "rect") {
      shape = { type: "rect", x: this.startX, y: this.startY, width, height };
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(width * width + height * height) / 2;
      shape = {
        type: "circle",
        radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
      };
    } else if (selectedTool === "line") {
      shape = { type: "line", startX: this.startX, startY: this.startY, endX: x, endY: y };
    } else if (selectedTool === "arrow") {
      shape = { type: "arrow", startX: this.startX, startY: this.startY, endX: x, endY: y };
    } else if (selectedTool === "diamond") {
      const centerX = this.startX + width / 2;
      const centerY = this.startY + height / 2;
      shape = { type: "diamond", centerX, centerY, width: Math.abs(width), height: Math.abs(height) };
    } else if (selectedTool === "text") {
      shape = { type: "text", x: this.startX, y: this.startY, width: Math.abs(width), height: Math.abs(height), text: "" };

      // create textarea, same as previous code
      const input = document.createElement("textarea");
      input.style.position = "absolute";
      input.style.left = `${this.startX}px`;
      input.style.top = `${this.startY}px`;
      input.style.width = `${Math.abs(width)}px`;
      input.style.height = `${Math.abs(height)}px`;
      input.style.font = "16px Arial";
      input.style.color = "white";
      input.style.background = "transparent";
      input.style.border = "1px dashed white";
      input.style.outline = "none";
      input.style.resize = "none";

      document.body.appendChild(input);
      input.focus();

      input.addEventListener("blur", () => {
        // @ts-ignore
        shape!.text = input.value;
        // push pending and notify server like others:
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

    // push pending shape so user sees it immediately
    const pendingId = `pending-${Date.now()}`;
    this.existingShapes.push({ id: pendingId, shape });
    this.clearCanvas();

    // send to server (server will persist and broadcast back with real id)
    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      })
    );
  };

  //@ts-ignore
  mouseMoveHandler = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoords(e as MouseEvent);

    if (this.selectedTool === "pencil" && this.activePencil && this.clicked) {
      this.activePencil.addPoint(x, y);
      this.clearCanvas();
      this.activePencil.draw(this.ctx);
      return;
    }

    if (this.selectedTool === "eraser") {
      this.clearCanvas();
      if (!this.activeEraser) this.activeEraser = new Eraser(10);
      this.activeEraser.drawPreview(this.ctx, x, y);
      return;
    }

    // preview drawing for drag tools while holding mouse
    if (this.clicked) {
      const width = x - this.startX;
      const height = y - this.startY;
      this.clearCanvas();

      if (this.selectedTool === "rect") {
        this.ctx.strokeStyle = "white";
        this.ctx.strokeRect(this.startX, this.startY, width, height);
      } else if (this.selectedTool === "circle") {
        const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.beginPath();
        this.ctx.strokeStyle = "white";
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "line") {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "white";
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "arrow") {
        const headlen = 15;
        const dx = x - this.startX;
        const dy = y - this.startY;
        const angle = Math.atan2(dy, dx);
        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(
          x - headlen * Math.cos(angle - Math.PI / 6),
          y - headlen * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
          x - headlen * Math.cos(angle + Math.PI / 6),
          y - headlen * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "diamond") {
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, this.startX);
        // diamond preview (improved)
        this.ctx.moveTo(centerX, this.startY);
        this.ctx.lineTo(this.startX + width, centerY);
        this.ctx.lineTo(centerX, this.startY + height);
        this.ctx.lineTo(this.startX, centerY);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }

  setStrokeWidth(width: number) {
    this.defaultStrokeWidth = width;
    if (this.activePencil) {
      this.activePencil.setStrokeWidth(width);
    }
  }

  setStrokeColor(color: string) {
    this.defaultStrokeColor = color;
    if (this.activePencil) {
      this.activePencil.setStrokeColor(color);
    }
  }
}
