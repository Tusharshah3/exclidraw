import React, { useRef, useState } from "react";
import svg from "svg.js";
interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface PencilProps {
  strokeColor?: string;
  strokeWidth?: number;
}

const Pencil: React.FC<PencilProps> = ({
  strokeColor = "black",
  strokeWidth = 2,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);

  const getRelativePoint = (e: React.PointerEvent): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: e.clientX, y: e.clientY };
    const rect = svg.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const point = getRelativePoint(e);
    setIsDrawing(true);
    setCurrentPath(`M ${point.x} ${point.y}`);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const point = getRelativePoint(e);
    setCurrentPath((prev) => prev + ` L ${point.x} ${point.y}`);
  };

  const handlePointerUp = () => {
    if (isDrawing && currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath("");
    }
    setIsDrawing(false);
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full border border-gray-400 bg-white"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      ))}
      {currentPath && (
        <path d={currentPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      )}
    </svg>
  );
};

export default Pencil;
