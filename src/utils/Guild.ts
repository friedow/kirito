import Discord from 'discord.js';

export default class Guild {
  public guildId: Discord.Snowflake;
  public experience: number;
  public discord!: Discord.Guild;

  constructor(client: Discord.Client, id: Discord.Snowflake) {
    this.guildId = id;
    this.experience = 0;
  }

  public fetchData(discordClient: Discord.Client) {
    this.discord = discordClient.guilds.find((guild: Discord.Guild) => guild.id === this.guildId);
  }

  public get displayIconURL(): string {
    return this.discord.iconURL ?
      this.discord.iconURL :
      'https://discordapp.com/assets/5c5bb53489a0a9f602df0a24c5981523.svg';
  }
}
