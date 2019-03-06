import Discord from 'discord.js';
import winston from 'winston';
import UserModel from '@/models/UserModel';
import User from '@/utils/User';
import Guild from '@/utils/Guild';
import GuildWithExperience from '@/interfaces/GuildWithExperience';
import ProfileInformation from '@/interfaces/ProfileInformation';
import handlebars from 'handlebars';
import fs from 'fs';
import Pageres from 'pageres';
import Plugin from './Plugin';

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

    const experience = this.calculateOverallExperience(dbUser.guilds);

    const profileInformation = {
      username: user.username,
      level: this.calculateLevel(experience),
      levelProgress: this.calculateLevelProgress(experience),
      avatar: user.avatarURL,
      servers: this.fetchGuildData(dbUser.guilds),
    };

    const templateFilename = process.cwd() + '/src/interface/templates/profile.html';
    return this.getProfileImageLocation(templateFilename, profileInformation);
  }

  private calculateOverallExperience(guilds: Guild[]): number {
    let experience = 0;
    guilds.forEach((guild) => experience += guild.experience);
    return experience;
  }


  /**
   * Calculates the level given a total amount of experience.
   * @param {Number} experience - Amount of experience.
   * @return {Number} Level corresponding to experience.
   */
  private calculateLevel(experience: number): number {
    return Math.floor(Math.sqrt(experience / 3 + 36) - 5);
  }

  /**
   * Calculates the progress of the current level given a total amount
   * of experience.
   * @param {Number} experience - Amount of experience.
   * @return {Number} Level progress in percent (0 - 100).
   */
  private calculateLevelProgress(experience: number): number {
    const userLevel = this.calculateLevel(experience);
    const currentLevelMinExperience = this.minLevelExperience(userLevel);
    const nextLevelMinExperience = this.minLevelExperience(userLevel + 1);
    const currentLevelExperience = nextLevelMinExperience - currentLevelMinExperience;
    const userLevelExperience = experience - currentLevelMinExperience;
    return userLevelExperience * 100 / currentLevelExperience;
  }

  /**
   * Calculates the minimal amount of experience needed for a given level.
   * @param {Number} level - The level, which the experience is calculated for.
   * @return {Number} Amount of Experience needed for the level.
   */
  private minLevelExperience(level: number): number {
    return (3 * level * (level + 10) - 33);
  }

  private fetchGuildData(guilds: Guild[]): GuildWithExperience[] {
    return guilds.map((guild) => {
      const guildWithExperience = (this.discord.guilds.find('id', guild.guildId) as GuildWithExperience);
      guildWithExperience.experience = guild.experience;
      return guildWithExperience;
    });
  }

  /**
   * Creates a HTML profile file containing user information based on
   * a profile template.
   * @param {String} templateFilename - Path of the template Handlebars file.
   * @param {Object} templateInformation - Information to fill the Handlebars teamplate with.
   * @return {String} Image stream.
   */
  private async getProfileImageLocation(templateFilename: string, templateInformation: any): Promise<string> {
    const randomFilename = Math.random().toString(36).substring(7);
    const outputFilname = process.cwd() + '/src/interface/' + randomFilename + '.html';
    const templateFile = fs.readFileSync(templateFilename).toString();
    const template = handlebars.compile(templateFile);
    const html = template(templateInformation);
    fs.writeFileSync(outputFilname, html);

    await new Pageres()
      .src(outputFilname, ['500x1000'], {crop: true, selector: '.main', filename: '<%= url %>'})
      .dest(process.cwd() + '/src/interface/')
      .run();

    return process.cwd() + '/src/interface/' + randomFilename + '.html.png';
  }
}
