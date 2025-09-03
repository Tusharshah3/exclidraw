// Define the structure of a plain object representation of a pencil stroke.
// This is what we'll send over the network and save to the database.
export interface PencilShape {
    type: "pencil";
    points: { x: number; y: number }[];
    color: string;
}

/**
 * A class to manage the state and drawing of a single, continuous pencil stroke.
 */
export class Pencil {
    public points: { x: number; y: number }[];
    private color: string;

    constructor(startX: number, startY: number, color: string) {
        this.points = [{ x: startX, y: startY }];
        this.color = color;
    }

    /**
     * Adds a new point to the stroke as the mouse moves.
     * @param x - The x-coordinate of the new point.
     * @param y - The y-coordinate of the new point.
     */
    addPoint(x: number, y: number) {
        this.points.push({ x, y });
    }

    /**
     * Renders the pencil stroke onto a given canvas rendering context.
     * @param ctx - The 2D canvas context to draw on.
     */
    draw(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2; // This can be a future enhancement
        ctx.lineCap = 'round'; // Makes the line ends smoother
        ctx.lineJoin = 'round'; // Makes the line corners smoother
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
    }

    /**
     * Converts the Pencil class instance into a plain serializable object
     * that can be sent over the network or saved.
     * @returns A PencilShape object.
     */
    toShapeObject(): PencilShape {
        return {
            type: "pencil",
            points: this.points,
            color: this.color
        };
    }
}
