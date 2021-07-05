import { Message } from "@keix/message-store-client";
import { BaseMetadata } from "@keix/message-store-client/dist/types";

export const COMMAND_SCHEDULER_CATEGORY = "commandScheduler";

export interface CommandTask {
  id: string;
  category: string;
  command: string;
  commandData: { [key: string]: any };
  commandMetadata: BaseMetadata;
  date: string;
  rate: SchedulerRate;
  nextDate: string;
}

export enum SchedulerRate {
  NONE = "NONE",
  HOURLY = "HOURLY",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

export enum CommandSchedulerCommandType {
  SCHEDULE_COMMAND = "SCHEDULE_COMMAND",
  DISCARD_COMMAND = "DISCARD_COMMAND",
  TRIGGER_COMMAND = "TRIGGER_COMMAND",
}

export interface ScheduleCommandData {
  id: string;
  category: string;
  command: string;
  commandData: any;
  date: string;
  rate: SchedulerRate;
}

export interface DiscardCommandData {
  id: string;
  category: string;
}

export interface TriggerCommandData {
  id: string;
  category: string;
}

export type ScheduleCommand = Message<
  CommandSchedulerCommandType.SCHEDULE_COMMAND,
  ScheduleCommandData
>;
export type DiscardCommand = Message<
  CommandSchedulerCommandType.DISCARD_COMMAND,
  DiscardCommandData
>;
export type TriggerCommand = Message<
  CommandSchedulerCommandType.TRIGGER_COMMAND,
  TriggerCommandData
>;

export type CommandSchedulerCommand =
  | ScheduleCommand
  | DiscardCommand
  | TriggerCommand;

export enum CommandSchedulerEventType {
  COMMAND_SCHEDULER_COMMAND_FAILED = "COMMAND_SCHEDULER_COMMAND_FAILED",
  COMMAND_SCHEDULED = "COMMAND_SCHEDULED",
  COMMAND_DISCARDED = "COMMAND_DISCARDED",
  COMMAND_TRIGGERED = "COMMAND_TRIGGERED",
}

export type CommandSchedulerEvent =
  | Message<
      CommandSchedulerEventType.COMMAND_SCHEDULER_COMMAND_FAILED,
      { errorMessage: string }
    >
  | Message<CommandSchedulerEventType.COMMAND_SCHEDULED, ScheduleCommandData>
  | Message<CommandSchedulerEventType.COMMAND_DISCARDED, DiscardCommandData>
  | Message<CommandSchedulerEventType.COMMAND_TRIGGERED, TriggerCommandData>;
