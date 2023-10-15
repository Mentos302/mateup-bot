const dayjs = require('dayjs');

import { Markup, Scenes } from 'telegraf';
import { UseFilters } from '@nestjs/common';
import { Scene, SceneEnter, Action, On, Ctx, Message } from 'nestjs-telegraf';
import { Context, SceneState } from 'src/interfaces/context.interface';
import { SCENE_SETTINGS } from 'src/common/config/scene';
import { SanityService } from 'src/sanity/sanity.service';
import { TelegrafExceptionFilter } from 'src/common/filters/telegraf-exception.filter';
import { GoogleSheetsService } from 'src/services/google-sheets/google-sheets.service';

@Scene('lesson_student', SCENE_SETTINGS)
@UseFilters(TelegrafExceptionFilter)
export class LessonStudentScene {
  constructor(
    private readonly sanityService: SanityService,
    private readonly sheetsService: GoogleSheetsService,
  ) {}
  @SceneEnter()
  onSceneEnter(ctx: Context) {
    const { user } = ctx.scene.state as SceneState;

    ctx.replyWithHTML(
      `💫 Напишіть ім'я учня або оберіть зі списку:`,
      Markup.inlineKeyboard([
        ...user.students.map((student) => [
          {
            text: student,
            callback_data: student,
          },
        ]),
        [{ text: `↩️ Скасувати додавання `, callback_data: 'back' }],
      ]),
    );
  }

  @Action('reneter')
  async onReEnter(ctx: Context): Promise<void> {
    ctx.answerCbQuery();

    ctx.scene.reenter();
  }

  @Action('back')
  async onBack(ctx: Context): Promise<void> {
    ctx.answerCbQuery();

    ctx.replyWithHTML(
      `🚫 Додавання заняття скасовано.`,
      Markup.inlineKeyboard([
        {
          text: 'Додати нове заняття',
          callback_data: 'rndmsht',
        },
      ]),
    );

    ctx.scene.leave();
  }

  @On('callback_query')
  async onSubjectChoosing(ctx: Context) {
    ctx.scene.enter('lesson_topic', {
      ...ctx.scene.state,
      student: (ctx.callbackQuery as any).data,
    });
  }

  @On('text')
  async onText(@Ctx() ctx: Context, @Message('text') name: string) {
    const validNamePattern =
      /^[А-ЩЬЮЯа-щьюяіІїЇґҐ'-]+(\s[А-ЩЬЮЯа-щьюяіІїЇґҐ'-]+)?$/;

    if (!validNamePattern.test(name)) {
      ctx.replyWithHTML(
        `Будь ласка, введіть дійсне ім'я.`,
        Markup.inlineKeyboard([
          [{ text: `Повернутись назад`, callback_data: 'reneter' }],
        ]),
      );

      return;
    }

    await this.sanityService.addStudentToUser(ctx.from.id, name);

    ctx.scene.enter('lesson_topic', { ...ctx.scene.state, student: name });
  }

  @On('message')
  async onMessage(ctx: Context): Promise<void> {
    ctx.scene.reenter();
  }
}
