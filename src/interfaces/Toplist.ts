import Discord from 'discord.js';
import User from '@/utils/User';

export default interface Toplist {
  guild: Discord.Guild;
  users: User[];
}
