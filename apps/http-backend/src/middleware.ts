import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization ?? "";

    const decoded=JWT.verify(token, JWT_SECRET);
    if(decoded){
        // @ts-ignore
        req.body.userId = decoded.userId;
        next();
        
    }
    else {
        res.status(401).json({message: "Unauthorized"});
    }


};
