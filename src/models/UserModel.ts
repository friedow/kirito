import { Document, Schema, Model, model } from 'mongoose';
import User from '@/utils/User';

export interface IUserModel extends User, Document {}

const userSchema = new Schema({
    userId: String,
    guilds: Array,
});

userSchema.loadClass(User);

const UserModel: Model<IUserModel> = model('User', userSchema);

export default UserModel;
