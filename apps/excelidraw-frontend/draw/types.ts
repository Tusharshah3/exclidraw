import { PencilShape } from "./Pencil";

// The complete Tool type definition
export type Tools = "select" | "text" | "circle" | "rect" | "pencil" | "line" | "eraser" | "arrow" | "diamond";

// The complete Shape type definition, with a unique frontend ID
export type Shapes =   (
    | { type: "rect"; x: number; y: number; width: number; height: number; color?: string; }
    | { type: "circle"; centerX: number; centerY: number; radius: number; color?: string; }
    | { type: "line"; startX: number; startY: number; endX: number; endY: number; color?: string; }
    | { type: "arrow"; startX: number; startY: number; endX: number; endY: number; color?: string; }
    | { type: "diamond"; centerX: number; centerY: number; width: number; height: number; color?: string; }
    | { type: "text"; x: number; y: number; text: string; color?: string; fontSize: number; }
    | PencilShape
);