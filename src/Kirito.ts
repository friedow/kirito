import Discord from 'discord.js';
import mongoose from 'mongoose';
import winston from 'winston';
import ExperiencePlugin from './plugins/ExperiencePlugin';
import ProfilePlugin from './plugins/ProfilePlugin';
import ConversationPlugin from './plugins/ConversationPlugin';
import ToplistPlugin from './plugins/ToplistPlugin';

export default class Kirito {
  private discord: Discord.Client;
  private plugins: any[];

  constructor() {
    this.discord = new Discord.Client();
    this.plugins = [];
  }

  public async run() {
    await this.connectToDatabase();
    winston.info(`Successfully connected to mongoDB.`);
    this.subscribeToDiscordEvents();
    await this.connectToDiscord();
    this.plugins.push(new ConversationPlugin(this.discord));
    this.plugins.push(new ExperiencePlugin(this.discord));
    this.plugins.push(new ProfilePlugin(this.discord));
    this.plugins.push(new ToplistPlugin(this.discord));
  }

  private async connectToDatabase(): Promise<any> {
    return new Promise((resolve, reject) => {
      const db = mongoose.connection;
      db.once('open', resolve);

      winston.info(`Connecting to mongoDB on ${process.env.MONGO_HOST || 'localhost'}.`);
      mongoose.connect(`mongodb://${process.env.MONGO_HOST || 'localhost'}/kirito`, { useNewUrlParser: true });
    });
  }

  private async connectToDiscord(): Promise<void> {
    winston.info(`Connecting to discord API using bot API token.`);
    this.discord.login(process.env.AUTH_TOKEN);
    winston.info(`Successfully connected to discord API.`);
  }

  /**
   * Initializes the bot
   */
  private async prepareBot(): Promise<void> {
    await this.discord.user.setActivity('Sword Art Online', { type: 'PLAYING' });
  }

  /**
   * Registers callbacks to discord events
   */
  private subscribeToDiscordEvents(): void {
    winston.info(`Subscribing to discord events.`);
    // Bind this into callback functions
    this.prepareBot = this.prepareBot.bind(this);

    // Subscribe to events
    this.discord.on('ready', this.prepareBot);
    this.discord.on('error', winston.error);
    winston.info(`Successfully subscribed to discord events.`);
  }
}
