import { runProjector } from "@keix/message-store-client";
import { EventCredits, EventTypeCredit } from "./types";

export async function runBalanceProjector(
  id: string,
  until?: number
): Promise<number> {
  const MAX_USE_CREDITS_DELAY = 365;

  let datetime = new Date();
  datetime.setDate(datetime.getDay() - MAX_USE_CREDITS_DELAY);
  function reducer(res: number, next: EventCredits) {
    if (next.time >= datetime) {
      if (next.type === EventTypeCredit.CREDITS_USED) {
        res -= next.data.amount;
      } else if (next.type === EventTypeCredit.CREDITS_EARNED) {
        res += next.data.amount;
      }
    }
    return Math.max(0, res);
  }
  return runProjector(
    { streamName: `creditAccount-${id}`, untilPosition: until },
    reducer,
    0
  );
}
export async function runBalanceProjectorDelay(
  id: string,
  until?: number
): Promise<number> {
  let datetime = new Date();
  function reducer(res: number, next: EventCredits) {
    if (
      next.type === EventTypeCredit.CREDITS_EARNED_SCHEDULER &&
      next.data.dateValidation > datetime
    ) {
      res += next.data.amount;
    }
    return Math.max(0, res);
  }
  return runProjector(
    { streamName: `creditAccount-${id}`, untilPosition: until },
    reducer,
    0
  );
}
