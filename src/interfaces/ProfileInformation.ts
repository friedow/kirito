import GuildWithExperience from './GuildWithExperience';

export default interface ProfileInformation {
  username: string;
  level: number;
  levelProgress: number;
  avatar: string;
  servers: GuildWithExperience[];
}
