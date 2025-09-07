import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { middleware } from "./middleware";
import bcrypt from "bcrypt";
import { CreateUserSchema, SigninSchema, CreateRoomSchema } from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {
    console.log("Signup request body:", req.body); // Debug log
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
         res.status(400).json({ message: "Incorrect inputs", errors: parsedData.error.issues });
         return;
    }

    try {
        const { username, password, name } = parsedData.data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prismaClient.user.create({
            data: { email: username, password: hashedPassword, name }
        });
        console.log("User created with ID:", user.id); // Debug log
        console.log("User created with email:", user.email); // Debug log
        console.log("User created with name:", user.name); // Debug log
        console.log("User created with password ",hashedPassword);

        res.status(201).json({ message: "User created successfully", userId: user.id });
        return;
    } catch (e) {
        res.status(411).json({ message: "User already exists with this email" });
        return;
    }
});

app.post("/signin", async (req, res) => {
    console.log("Signin request body:", req.body); // Debug log
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
    console.log("Generated JWT token for user ID:", user.id); // Debug log
    console.log("Token:", token); // Debug log
    res.json({ token });
});

app.post("/room", middleware, async (req, res) => {
    console.log("Create room request body:", req.body); // Debug log
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
app.get("/rooms", middleware, async (req, res) => {
    console.log("Get rooms request"); // Debug log
    //@ts-ignore
    const userId = (req.userId);
    console.log("token from middleware:", req.headers.authorization); // Debug log
    console.log("User ID from token:", userId); // Debug log
    console.log(typeof userId);
    
    try {
        const rooms = await prismaClient.room.findMany({
        where: {
            adminId:userId
        },
        orderBy: {
                id: "desc"
            }
    });

    if (!rooms) {
        res.json({
            message: "Incorrect inputs or NULL rooms"
        })
        return;
    }
        res.json({
            rooms: rooms
        })
        console.log("Rooms found:", rooms); // Debug log
    } catch(e) {
        res.status(411).json({
            message: "cannot find rooms"
        })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    console.log("Get chats request for roomId:", req.params.roomId); // Debug log
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
        if (messages.length == 0) {
            console.log("No messages found for roomId:", roomId); // Debug log
            return;
        }
        console.log("Messages found for roomId:", roomId, messages); // Debug log
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
    console.log("Get room request for slug:", req.params.slug); // Debug log
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
    console.log("Room found roomid:", room); // Debug log
})


app.listen(3001);