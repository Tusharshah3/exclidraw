import express from "express";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {CreateUserSchema, SigninSchema, CreateRoomSchema} from "@repo/common/types";

const app= express();

app.post("/signup",async(req,res)=>{
    //db call
    const data=CreateUserSchema.safeParse(req.body);
    if(!data.success){
        return res.json({
            message:"incorrect input"
        })
    }


    res.json({userId:"12334"});

})
app.post("/signin",async(req,res)=>{

    const data=SigninSchema.safeParse(req.body);
    if(!data.success){
        return res.json({
            message:"incorrect input"
        })
    }

    const userId = "12334"; // This should be fetched from the database after validating username and password
    const token=JWT.sign({userId},JWT_SECRET);
    res.status(200).json({"token":token});
})

app.post("/room",middleware,async(req,res)=>{
    //dbcall 
    const data=CreateRoomSchema.safeParse(req.body);
    if(!data.success){
        return res.json({
            message:"incorrect input"
        })
    }

    res.status(201).json({message: "Room created successfully"});
})


app.listen(3001);