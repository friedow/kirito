import GuildWithExperience from './GuildWithExperience';

export default interface UserProfile {
  username: string;
  level: number;
  levelProgress: number;
  avatar: string;
  servers: GuildWithExperience[];
}
