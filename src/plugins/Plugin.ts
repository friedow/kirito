import Discord from 'discord.js';

export default abstract class Plugin {
  protected discord: Discord.Client;

  constructor(discord: Discord.Client) {
    this.discord = discord;
  }
}
