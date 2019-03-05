import Discord from 'discord.js';

export default interface Guild {
  guildId: Discord.Snowflake;
  experience: number;
}
