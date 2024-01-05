import { IContext } from '../interface';

export function resetSession(ctx: IContext): void {
  delete ctx.session.selectedDate;
  delete ctx.session.selectedMonth;
  delete ctx.session.selectedYear;
  ctx.session.awaitingUserIdInput = false;
  delete ctx.session.type;
}
