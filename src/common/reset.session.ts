import { IContext } from '../interface';
import { WizardContext } from 'telegraf/typings/scenes';

export async function resetSession(ctx: IContext & WizardContext) {
  delete ctx.session.selectedDate;
  delete ctx.session.selectedMonth;
  delete ctx.session.selectedYear;
  ctx.session.awaitingUserIdInput = false;
  await ctx.scene.leave();
  delete ctx.session.type;
  // delete ctx.session.compare
}
