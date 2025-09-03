import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "./middleware";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())
import bcrypt from "bcrypt";
app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
         res.status(400).json({ message: "Incorrect inputs" });
         return;
    }

    try {
        const { username, password, name } = parsedData.data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prismaClient.user.create({
            data: { email: username, password: hashedPassword, name }
        });

        res.status(201).json({ userId: user.id });
    } catch(e) {
        res.status(411).json({ message: "User already exists with this email" });
    }
}); 
app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Incorrect inputs" });
        return;
    }

    const { username, password } = parsedData.data;
    const user = await prismaClient.user.findFirst({
        where: { email: username }
    });

    if (!user) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(403).json({ message: "Invalid credentials" });
        return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token });
});



app.post("/room", middleware, async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    // @ts-ignore: TODO: Fix this
    const userId = req.userId;

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId: room.id
        })
    } catch(e) {
        res.status(411).json({
            message: "Room already exists with this name"
        })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

app.listen(3001);