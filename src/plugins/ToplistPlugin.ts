import Discord from 'discord.js';
import Plugin from '@/plugins/Plugin';
import winston from 'winston';
import UserModel from '@/models/UserModel';
import TemplateUtil from '@/utils/TemplateUtils';
import Toplist from '@/interfaces/Toplist';

export default class ToplistPlugin extends Plugin {
  constructor(discord: Discord.Client) {
    super(discord);
    this.discord.on('message', (message) => this.handleMessage(message));
  }

  private async handleMessage(message: Discord.Message): Promise<void> {
    if (message.author.bot) {
      return;
    }

    if (message.content === 'toplist') {
      if (message.channel.type !== 'text') {
        message.channel.send('This command is currently only available inside server channels.');
        return;
      }
      const channel: Discord.TextChannel = message.channel as Discord.TextChannel;

      winston.log('info', `Printing toplist for ${channel.guild.name}.`);
      message.channel.startTyping();
      const toplistImage = await this.getToplist(channel.guild);
      message.channel.send({
        files: [{
          attachment: toplistImage,
          name: 'toplist.png',
        }],
      });
      message.channel.stopTyping();

      winston.log('info', `Successfully printed toplist for ${channel.guild.name}.`);
    }
  }

  private async getToplist(guild: Discord.Guild): Promise<string> {
    const users = await UserModel.find({ guilds: { $elemMatch: { guildId: guild.id } } }).exec();

    for (const user of users) {
      user.fetchUser(this.discord);
    }

    const toplist: Toplist = {
      guild,
      users,
    };

    return TemplateUtil.getToplistPng(toplist);
  }
}
