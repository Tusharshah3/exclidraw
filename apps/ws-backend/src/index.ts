import { WebSocketServer } from "ws";

const wss= new WebSocketServer({port:8080});

wss.on('connection',function connection(ws){

    ws.on('message',function message(data){
        console.log('recieved data:%s',data);
        ws.send('hello from ws server');
    })
})