import Discord from 'discord.js';
import Guild from '@/utils/Guild';

export default class User {
  /**
   * Calculates the minimal amount of experience needed for a given level.
   * @param {Number} level - The level, which the experience is calculated for.
   * @return {Number} Amount of Experience needed for the level.
   */
  private static minLevelExperience(level: number): number {
    return (3 * level * (level + 10) - 33);
  }

  public userId: Discord.Snowflake;
  public guilds: Guild[];

  constructor(id: Discord.Snowflake, guilds: Guild[]) {
    this.userId = id;
    this.guilds = guilds;
  }

  public get experience(): number {
    let experience = 0;
    this.guilds.forEach((guild) => experience += guild.experience);
    return experience;
  }

  /**
   * Calculates the level given a total amount of experience.
   * @param {Number} experience - Amount of experience.
   * @return {Number} Level corresponding to experience.
   */
  public get level(): number {
    return Math.floor(Math.sqrt(this.experience / 3 + 36) - 5);
  }

  /**
   * Calculates the progress of the current level given a total amount
   * of experience.
   * @param {Number} experience - Amount of experience.
   * @return {Number} Level progress in percent (0 - 100).
   */
  public get levelProgress(): number {
    const levelMinExperience = User.minLevelExperience(this.level);
    const nextLevelMinExperience = User.minLevelExperience(this.level + 1);
    const currentLevelExperience = nextLevelMinExperience - levelMinExperience;
    const userLevelExperience = this.experience - levelMinExperience;
    return userLevelExperience * 100 / currentLevelExperience;
  }
}
