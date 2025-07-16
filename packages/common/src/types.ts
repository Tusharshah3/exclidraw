import {z } from 'zod';
export const CreateUserSchema = z.object({
    username :z.string().min(3).max(20),
    password :z.string().min(4).max(20),
    name:z.string()
})
export const SigninSchema = z.object({
    username :z.string().min(3).max(20),
    password :z.string().min(4).max(20),
})
export const CreateRoomSchema = z.object({
    name:z.string().min(3).max(20),
    
})
