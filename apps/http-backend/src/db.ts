import mongoose,{Schema} from 'mongoose';

export interface users{
    username:string,
    poasswordHash:string,
    rooms:string[],
    createdAT:Date;
    updatedAT:Date;
}

const userSchema= new Schema<users>({
    username:{type:String,required:true,unique:true},
    poasswordHash:{type:String,required:true},
},
    {timestamps:true}
);

export const User =mongoose.model<users>('User',userSchema);