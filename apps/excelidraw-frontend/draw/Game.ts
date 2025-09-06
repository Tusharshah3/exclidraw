import { Tools } from "@/draw/tools";
import { getExistingShapes } from "./http";
type Tool=Tools;

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pencil";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "diamond";
      centerX: number;
      centerY: number;
      width: number;
      height: number;
    }
    | {
        type: "text";
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
    }

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";

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
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    setTool(tool: Tools) {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log(this.existingShapes);
        this.clearCanvas();
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            }
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.map((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "pencil") {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "line") {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "arrow") {
                const headlen = 10; // length of arrowhead
                const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);

                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();

                // Arrowhead
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
                this.ctx.moveTo(cx, cy - h); // top
                this.ctx.lineTo(cx + w, cy); // right
                this.ctx.lineTo(cx, cy + h); // bottom
                this.ctx.lineTo(cx - w, cy); // left
                this.ctx.closePath();
                this.ctx.stroke();
            } else if (shape.type === "text") {
                this.ctx.font = "16px Arial";
                this.ctx.fillStyle = "white";
                this.ctx.fillText(shape.text, shape.x, shape.y + 16);
            }

    
  })

}
    //@ts-ignore
    mouseDownHandler = (e) => {
        this.clicked = true
        this.startX = e.clientX
        this.startY = e.clientY
    }
    //@ts-ignore
    mouseUpHandler = (e) => {
    this.clicked = false;
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;

    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;

    if (selectedTool === "rect") {
        shape = {
            type: "rect",
            x: this.startX,
            y: this.startY,
            height,
            width
        };
    } else if (selectedTool === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        shape = {
            type: "circle",
            radius,
            centerX: this.startX + width / 2,
            centerY: this.startY + height / 2,
        };
    } else if (selectedTool === "line") {
        shape = {
            type: "line",
            startX: this.startX,
            startY: this.startY,
            endX: e.clientX,
            endY: e.clientY
        };
    } else if (selectedTool === "arrow") {
        shape = {
            type: "arrow",
            startX: this.startX,
            startY: this.startY,
            endX: e.clientX,
            endY: e.clientY
        };
    } else if (selectedTool === "diamond") {
        const centerX = this.startX + width / 2;
        const centerY = this.startY + height / 2;
        shape = {
            type: "diamond",
            centerX,
            centerY,
            width: Math.abs(width),
            height: Math.abs(height)
        };
    } else if (selectedTool === "pencil") {
        shape = {
            type: "pencil",
            startX: this.startX,
            startY: this.startY,
            endX: e.clientX,
            endY: e.clientY
        };
    } else if (selectedTool === "text") {
    shape = {
        type: "text",
        x: this.startX,
        y: this.startY,
        width: Math.abs(width),
        height: Math.abs(height),
        text: "" // initially empty, will be filled from textarea
    };

    // Create a floating textarea for typing
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
        //@ts-ignore
        shape.text = input.value;
        //@ts-ignore
        this.existingShapes.push(shape);
        this.clearCanvas();
        // this.redrawAllShapes();
        document.body.removeChild(input);
    });
}


    if (!shape) {
        return;
    }

    this.existingShapes.push(shape);

    this.socket.send(JSON.stringify({
        type: "chat",
        message: JSON.stringify({
            shape
        }),
        roomId: this.roomId
    }));
    }

    //@ts-ignore
    mouseMoveHandler = (e) => {
    if (this.clicked) {
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        this.clearCanvas();
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        const selectedTool = this.selectedTool;

        if (selectedTool === "rect") {
            this.ctx.strokeRect(this.startX, this.startY, width, height);

        } else if (selectedTool === "circle") {
            const radius = Math.max(width, height) / 2;
            const centerX = this.startX + radius;
            const centerY = this.startY + radius;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();

        } else if (selectedTool === "line") {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
            this.ctx.closePath();

        } else if (selectedTool === "arrow") {
            const headlen = 10; // arrow head size
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            const angle = Math.atan2(dy, dx);

            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.lineTo(
                e.clientX - headlen * Math.cos(angle - Math.PI / 6),
                e.clientY - headlen * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(e.clientX, e.clientY);
            this.ctx.lineTo(
                e.clientX - headlen * Math.cos(angle + Math.PI / 6),
                e.clientY - headlen * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
            this.ctx.closePath();

        } else if (selectedTool === "diamond") {
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, this.startY);
            this.ctx.lineTo(this.startX + width, centerY);
            this.ctx.lineTo(centerX, this.startY + height);
            this.ctx.lineTo(this.startX, centerY);
            this.ctx.closePath();
            this.ctx.stroke();

        } else if (selectedTool === "pencil") {
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
        } else if (selectedTool === "text") {
            this.ctx.strokeStyle = "rgba(255,255,255)";
            this.ctx.strokeRect(this.startX, this.startY, width, height);

            this.ctx.font = "16px Arial";
            this.ctx.fillStyle = "white";
            this.ctx.textBaseline = "top";
            this.ctx.fillText("Text", this.startX + 4, this.startY + 4); 
        }

        }
    }


    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    

    }
}