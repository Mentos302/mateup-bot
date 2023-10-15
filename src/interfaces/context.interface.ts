import { Scenes } from 'telegraf';

export interface Context extends Scenes.SceneContext {}

export interface SceneState {
  user: User;
  date: string;
  subject: string;
  student: string;
  topic: string;
}
