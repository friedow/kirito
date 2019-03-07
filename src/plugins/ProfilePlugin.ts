import Discord from 'discord.js';
import winston from 'winston';
import UserModel from '@/models/UserModel';
import User from '@/utils/User';
import Guild from '@/utils/Guild';
import GuildWithExperience from '@/interfaces/GuildWithExperience';
import Plugin from './Plugin';
import TemplateUtil from '@/utils/TemplateUtils';

export default class ProfilePlugin extends Plugin {
  constructor(discord: Discord.Client) {
    super(discord);
    this.discord.on('message', (message) => this.handleMessage(message));
  }

  private async handleMessage(message: Discord.Message): Promise<void> {
    if (message.author.bot) {
      return;
    }

    if (message.content === 'profile') {
      winston.log('info', `Printing profile for ${message.author}.`);

      message.channel.startTyping();
      const profileImage = await this.getProfile(message.author);
      message.channel.send({
        files: [{
          attachment: profileImage,
          name: 'profile.png',
        }],
      });
      message.channel.stopTyping();

      winston.log('info', `Successfully printed profile for ${message.author}.`);
    }
  }

  private async getProfile(user: Discord.User): Promise<string> {
    let dbUser = await UserModel.findOne({ userId: user.id }).exec();

    if (!dbUser) {
      dbUser = await UserModel.create(new User(user.id, []));
    }

    const profileInformation = {
      username: user.username,
      level: dbUser.level,
      levelProgress: dbUser.experience,
      avatar: user.avatarURL,
      servers: this.fetchGuildData(dbUser.guilds),
    };

    return TemplateUtil.getProfilePng(profileInformation);
  }

  private fetchGuildData(guilds: Guild[]): GuildWithExperience[] {
    return guilds.map((guild) => {
      const guildWithExperience = (this.discord.guilds.find('id', guild.guildId) as GuildWithExperience);
      guildWithExperience.experience = guild.experience;
      return guildWithExperience;
    });
  }
}
