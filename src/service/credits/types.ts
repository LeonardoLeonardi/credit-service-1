import type { Message } from "@keix/message-store-client";

export enum CommandTypeCredit {
  EARN_DELAYED_CREDIT = "EARN_DELAYED_CREDIT",
  EARN_CREDITS = "EARN_CREDITS",
  USE_CREDITS = "USE_CREDITS",
}
export type EarnDelayedCredit = Message<
  CommandTypeCredit.EARN_DELAYED_CREDIT,
  {
    userId: string;
    amount: number;
    transactionId?: string;
    creditDate: Date;
    delayed?: boolean;
  }
>;

export type EarnCredits = Message<
  CommandTypeCredit.EARN_CREDITS,
  {
    userId: string;
    amount: number;
    transactionId?: string;
    delayed?: boolean;
    creditDate: Date;
  }
>;
export type UseCredits = Message<
  CommandTypeCredit.USE_CREDITS,
  {
    userId: string;
    amount: number;
    transactionId?: string;
    delayed?: boolean;
    creditDate: Date;
  }
>;

export type CommandCredits = EarnDelayedCredit | EarnCredits | UseCredits;

export enum EventTypeCredit {
  CREDITS_EARNED = "CREDITS_EARNED",
  CREDITS_EARNED_SCHEDULER = "CREDITS_EARNED_SCHEDULER",
  CREDITS_USED = "CREDITS_USED",
  CREDITS_ERROR = "CREDITS_ERROR",
}

export type CreditsEarnedScheduler = Message<
  EventTypeCredit.CREDITS_EARNED_SCHEDULER,
  {
    userId: string;
    amount: number;
    transactionId: string;
    creditDate: Date;
    delayed: boolean;
  }
>;
export type CreditsEarned = Message<
  EventTypeCredit.CREDITS_EARNED,
  {
    userId: string;
    amount: number;
    transactionId: string;
    delayed: boolean;
    creditDate: Date;
  }
>;
export type CreditsUsed = Message<
  EventTypeCredit.CREDITS_USED,
  {
    userId: string;
    amount: number;
    transactionId: string;
    delayed: boolean;
    creditDate: Date;
  }
>;
export type CreditsError = Message<
  EventTypeCredit.CREDITS_ERROR,
  { userId: string; type: string; delayed: boolean; creditDate: Date }
>;

export type EventCredits =
  | CreditsEarned
  | CreditsEarnedScheduler
  | CreditsUsed
  | CreditsError;
