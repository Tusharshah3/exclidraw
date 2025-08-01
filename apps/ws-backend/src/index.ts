import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
const wss= new WebSocketServer({port:8080});
import { JWT_SECRET } from "@repo/backend-common/config";

wss.on('connection',function connection(ws,request){
    const url=request.url;

    if(!url){return}
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token')||"";

    const decoded=jwt.sign(token,JWT_SECRET);
    if(typeof decoded==="string"){
        ws.close();
        console.error("invalide token in form of string");
        return ;
    }

    if(!decoded || !(decoded as JwtPayload).userId){
        ws.close();
        return;
    }
    ws.on('message',function message(data){
        console.log('recieved data:%s',data);
        ws.send('hello from ws server');
    })
})