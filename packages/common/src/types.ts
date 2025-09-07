import { z } from "zod";

export const CreateUserSchema = z.object({
    username: z.string().email({ message: "Invalid email address" }),
         password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
         name: z.string().min(2, { message: "Name is too short" })
});

export const SigninSchema = z.object({
         username: z.string().email(),
         password: z.string(),
});

export const CreateRoomSchema = z.object({
         name: z.string().min(3, { message: "Room name must be at least 3 characters" }).max(20),
});

export const JoinRoomSchema = z.object({
    slug: z.string().min(3),
});