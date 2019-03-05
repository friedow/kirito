import { Document, Schema, Model, model } from 'mongoose';
import User from '@/interfaces/User';

export interface IUserModel extends User, Document {}

const userSchema = new Schema({
    userId: String,
    guilds: Array,
});

const userModel: Model<IUserModel> = model('User', userSchema);

export default userModel;
