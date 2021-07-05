import {
  emitEvent,
  sendCommand,
  subscribe,
  Message,
  readLastMessage,
  combineSubscriber,
} from "@keix/message-store-client";
import { v4 } from "uuid";
import { runBalanceProjector } from "./projector";

import { CommandCredits, CommandTypeCredit, EventTypeCredit } from "./types";
import { CommandSchedulerCommandType, SchedulerRate } from "../Scheduler";

async function handler(cmd: CommandCredits) {
  const MIN_USE_CREDITS_AMOUNT = 100;

  if (
    await isLastMessageAfterGlobalPosition(
      `creditAccount-${cmd.data.userId}`,
      cmd
    )
  ) {
    return;
  }
  if (await isLastMessageAfterGlobalPosition(`commandScheduler:command`, cmd)) {
    return;
  }
  switch (cmd.type) {
    case CommandTypeCredit.EARN_DELAYED_CREDIT:
      await sendCommand({
        command: CommandSchedulerCommandType.SCHEDULE_COMMAND,
        category: "commandScheduler",
        data: {
          id: cmd.data.userId,
          category: "creditAccount",
          command: CommandTypeCredit.EARN_CREDITS,
          commandData: {
            userId: cmd.data.userId,
            amount: cmd.data.amount,
            dateValidation: cmd.data.dateValidation,
          },
          date: cmd.data.dateValidation,
          rate: SchedulerRate.NONE,
        },
      });
      return emitEvent({
        category: "creditAccount",
        id: cmd.data.userId,
        event: EventTypeCredit.CREDITS_EARNED_SCHEDULER,
        data: {
          userId: cmd.data.userId,
          transactionId: cmd.data.transactionId ?? v4(),
          amount: cmd.data.amount,
          delayed: true,
          dateValidation: cmd.data.dateValidation,
        },
      });

    case CommandTypeCredit.EARN_CREDITS:
      if (cmd.data.amount > 0) {
        return emitEvent({
          category: "creditAccount",
          id: cmd.data.userId,
          event: EventTypeCredit.CREDITS_EARNED,
          data: {
            userId: cmd.data.userId,
            transactionId: cmd.data.transactionId ?? v4(),
            delayed: cmd.data.delayed ?? false,
            amount: cmd.data.amount,
            dateValidation: cmd.data.dateValidation,
          },
        });
      } else {
        return;
      }
    case CommandTypeCredit.USE_CREDITS:
      let balance = await runBalanceProjector(cmd.data.userId);
      if (balance >= MIN_USE_CREDITS_AMOUNT && balance - cmd.data.amount >= 0) {
        return emitEvent({
          category: "creditAccount",
          id: cmd.data.userId,
          event: EventTypeCredit.CREDITS_USED,
          data: {
            userId: cmd.data.userId,
            transactionId: cmd.data.transactionId ?? v4(),
            amount: cmd.data.amount,
            dateValidation: cmd.data.dateValidation,
          },
        });
      } else {
        return emitEvent({
          category: "creditAccount",
          id: cmd.data.userId,
          event: EventTypeCredit.CREDITS_ERROR,
          data: {
            userId: cmd.data.userId,
            type:
              balance >= MIN_USE_CREDITS_AMOUNT
                ? "AmmontoMinimoNonRaggiunto"
                : "FondiNonSufficienti",
          },
        });
      }
  }
}

export async function runCredits() {
  return combineSubscriber(
    subscribe(
      {
        streamName: "creditAccount:command",
      },
      handler
    )
  );
}

async function isLastMessageAfterGlobalPosition(
  streamName: string,
  message: Message
) {
  const { global_position } = message;
  const lastMsg = await readLastMessage({
    streamName,
  });
  return lastMsg && lastMsg.global_position > global_position;
}
