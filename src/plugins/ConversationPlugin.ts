import Discord from 'discord.js';
import Plugin from './Plugin';

export default class ConversationPlugin extends Plugin {
  constructor(discord: Discord.Client) {
    super(discord);

    this.discord.on('message', (message) => this.handleMessage(message));
  }

  private handleMessage(message: Discord.Message): void {
    if (message.author.bot) {
      return;
    }

    switch (message.content) {
      case 'ping':
        message.channel.startTyping();
        message.channel.send('pong');
        message.channel.stopTyping();
        break;

      case 'pong':
        message.channel.startTyping();
        message.channel.send('ping');
        message.channel.stopTyping();
        break;

      case 'help':
        message.channel.startTyping();
        const help = `
          Here is a list of commands Kirito will understand:

          **ping** - Starts a table tennis match.
          **help** - Prints a list of available commands.
          **profile** - Shows your own profile.
          **toplist** - Shows a player ranking by experience.

          Have Fun :)`;
        message.channel.send(help);
        message.channel.stopTyping();
        break;
    }
  }
}
