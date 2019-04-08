import { Document, Schema, Model, model } from 'mongoose';
import User from '@/utils/User';
import Guild from '@/utils/Guild';

const guildSchema = new Schema({
  guildId: String,
  experience: Number,
});

guildSchema.loadClass(Guild);

const userSchema = new Schema({
    userId: String,
    guilds: [guildSchema],
});

userSchema.loadClass(User);

export interface IUserModel extends User, Document {}

const UserModel: Model<IUserModel> = model('User', userSchema);

export default UserModel;
