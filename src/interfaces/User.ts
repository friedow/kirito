import Discord from 'discord.js';
import Guild from '@/interfaces/Guild';

export default interface User {
  userId: Discord.Snowflake;
  guilds: Guild[]
}


