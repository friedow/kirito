import Discord from 'discord.js';
import User from '@/models/user';

export default class ExperiencePlugin {
  private static experienceRewardInterval = 60000;

  private discord: Discord.Client;
  private experienceRewardTimeout!: NodeJS.Timeout;

  constructor(discord: Discord.Client) {
    this.discord = discord;
    this.registerExperienceRewardTimeout();
  }

  private registerExperienceRewardTimeout(): void {
    this.experienceRewardTimeout = setInterval(
      () => this.rewardExperience(),
      ExperiencePlugin.experienceRewardInterval,
    );
  }

  private getCurrentlyConnectedUsers(): Discord.GuildMember[] {
    let connectedUsers: Discord.GuildMember[] = [];
    for (const guild of this.discord.guilds.array()) {
      for (const channel of guild.channels.array()) {
        if (channel.type === 'voice') {
          connectedUsers = connectedUsers.concat((channel as Discord.VoiceChannel).members.array());
        }
      }
    }
    return connectedUsers;
  }

  private async rewardExperience() {
    const connectedUsers = this.getCurrentlyConnectedUsers();

    for (const connectedUser of connectedUsers) {
      const dbUser = await User.findOne({ userId: connectedUser.id }).exec();

      if (dbUser) {
        const guildIndex = dbUser.guilds.findIndex((guild) => guild.guildId === connectedUser.guild.id);

        if (guildIndex >= 0) {
          dbUser.guilds[guildIndex].experience += 1;

        } else {
          dbUser.guilds.push({
            guildId: connectedUser.guild.id,
            experience: 1,
          });
        }
        dbUser.markModified('guilds');
        await dbUser.save();

      } else {
        User.create([
          {
            userId: connectedUser.id,
            guilds: [
              {
                guildId: connectedUser.guild.id,
                experience: 1,
              },
            ],
          },
        ]);
      }
    }

  }
}
