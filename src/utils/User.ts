import Discord from 'discord.js';
import Guild from '@/utils/Guild';

export default class User {
  public userId: Discord.Snowflake;
  public guilds: Guild[];

  constructor(id: Discord.Snowflake, guilds: Guild[]) {
    this.userId = id;
    this.guilds = guilds;
  }
}


