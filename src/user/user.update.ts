import { Markup } from 'telegraf';
import { On, Update, Ctx } from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import { SanityService } from 'src/sanity/sanity.service';
import { TelegrafExceptionFilter } from 'src/common/filters/telegraf-exception.filter';
import { UseFilters } from '@nestjs/common';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class UserUpdate {
  constructor(private readonly sanityService: SanityService) {}

  @On(['message', 'callback_query'])
  async onMessage(@Ctx() ctx: Context): Promise<unknown> {
    if (ctx.updateType === 'callback_query') ctx.answerCbQuery();

    const user = await this.sanityService.getUserByChatId(ctx.from.id);

    if (user && user.is_teacher)
      return ctx.scene.enter('lesson_date', { user });

    if (!user)
      await this.sanityService.createUser(
        ctx.from.id,
        `${ctx.from.first_name} ${ctx.from.last_name}`,
      );

    ctx.replyWithHTML(
      `👋 <b>Вітаю!</b>\n\nОчікуйте, незабаром Вас верифікують та нададуть доступ.`,
      Markup.inlineKeyboard([
        { text: 'Спробувати ще раз', callback_data: 'rnmsht' },
      ]),
    );
  }
}
