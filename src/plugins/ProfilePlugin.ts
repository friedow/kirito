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

  private async getProfile(discordUser: Discord.User): Promise<string> {
    let user = await UserModel.findOne({ userId: discordUser.id }).exec();

    if (!user) {
      user = await UserModel.create(new User(discordUser.id, []));
    }

    user.fetchUser(this.discord);

    return TemplateUtil.getProfilePng(user);
  }
}
