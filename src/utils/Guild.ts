import Discord from 'discord.js';

export default class Guild {
  public guildId: Discord.Snowflake;
  public experience: number;
  public discord!: Discord.Guild;

  constructor(id: Discord.Snowflake) {
    this.guildId = id;
    this.experience = 0;
  }
}
