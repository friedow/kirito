import Guild from '@/utils/Guild';

export default interface Profile {
  username: string;
  level: number;
  levelProgress: number;
  avatar: string;
  servers: Guild[];
}
