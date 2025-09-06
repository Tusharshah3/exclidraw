import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import {Circle, Pencil, RectangleHorizontalIcon ,MousePointer2,Type ,Minus,MoveUpRight,Diamond ,Eraser} from "lucide-react";
import { Game } from "@/draw/Game";
import {Tools}  from "@/draw/tools"

type Tool=Tools;
export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("select")

    useEffect(() => {
        //@ts-ignore
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {

        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }


    }, [canvasRef]);

    return <div style={{
        height: "100vh",
        overflow: "hidden"
    }}>
        <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight}></canvas>
        <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
    </div>
}

function Topbar({selectedTool, setSelectedTool}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return <div style={{
            position: "fixed",
            top: 10,
            left: 10
        }}>
            <div className="flex gap-t">
                <IconButton onClick={() => {setSelectedTool("pencil")}} activated={selectedTool === "pencil"} icon={<Pencil />}/>
                <IconButton onClick={() => { setSelectedTool("rect")}} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} ></IconButton>
                <IconButton onClick={() => { setSelectedTool("circle")}} activated={selectedTool === "circle"} icon={<Circle />}></IconButton>
                <IconButton onClick={() => setSelectedTool("select")} activated={selectedTool === "select"} icon={<MousePointer2 size={20} />}  />
                <IconButton onClick={() => setSelectedTool("text")} activated={selectedTool === "text"} icon={<Type  size={20} />}  />
                <IconButton onClick={() => setSelectedTool("line")} activated={selectedTool === "line"} icon={<Minus size={20} />}  />
                <IconButton onClick={() => setSelectedTool("arrow")} activated={selectedTool === "arrow"} icon={<MoveUpRight size={20} />}  />
                <IconButton onClick={() => setSelectedTool("diamond")} activated={selectedTool === "diamond"} icon={<Diamond  size={20} />}  />
                <IconButton onClick={() => setSelectedTool("eraser")} activated={selectedTool === "eraser"} icon={<Eraser size={20} />} />
           
            </div>
        </div>
}