import type { Message } from "@keix/message-store-client";

export enum CommandTypeCard {
  ADD_GIFT_CARD = "ADD_GIFT_CARD",
  UPDATE_GIFT_CARD = "UPDATE_GIFT_CARD",
  REMOVE_GIFT_CARD = "REMOVE_GIFT_CARD",
  REDEEM_GIFT_CARD = "REDEEM_GIFT_CARD",
  DELIVERY_GIFT_CARD = "DELIVERY_GIFT_CARD",
}

export type UpdateGiftCard = Message<
  CommandTypeCard.UPDATE_GIFT_CARD,
  {
    id: string;
    name: string;
    description: string;
    image_url: string;
    amounts: number[];
  }
>;

export type DeliveryGiftCard = Message<
  CommandTypeCard.DELIVERY_GIFT_CARD,
  {
    id: string;
    transactionId: string;
    idCard: string;
  }
>;
export type RemoveGiftCard = Message<
  CommandTypeCard.REMOVE_GIFT_CARD,
  { id: string }
>;
export type AddedGiftCard = Message<
  CommandTypeCard.ADD_GIFT_CARD,
  {
    id: string;
    name: string;
    description: string;
    image_url: string;
    amounts: number[];
  }
>;
export type RedeemGiftCard = Message<
  CommandTypeCard.REDEEM_GIFT_CARD,
  { id: string; transactionId: string; idCard: string; amount: number }
>;

export type CommandCard =
  | UpdateGiftCard
  | RemoveGiftCard
  | AddedGiftCard
  | RedeemGiftCard
  | DeliveryGiftCard;

export enum EventTypeCard {
  GIFT_CARD_ERROR = "GIFT_CARD_ERROR",
  GIFT_CARD_UPDATED = "GIFT_CARD_UPDATED",
  GIFT_CARD_REMOVED = "GIFT_CARD_REMOVED",
  GIFT_CARD_ADDED = "GIFT_CARD_ADDED",
  GIFT_CARD_REDEEM_PENDING = "GIFT_CARD_REDEEM_PENDING",
  GIFT_CARD_REDEEM_PROCESSING = "GIFT_CARD_REDEEM_PROCESSING",
  GIFT_CARD_REDEEM_FAILED = "GIFT_CARD_REDEEM_FAILED",
  GIFT_CARD_REDEEM_SUCCEDED = "GIFT_CARD_REDEEM_SUCCEDED",
}

export type GiftCardUpdated = Message<
  EventTypeCard.GIFT_CARD_UPDATED,
  {
    id: string;
    amounts: number[];
    name: string;
    description: string;
    image_url: string;
  }
>;
export type GiftCardRemoved = Message<
  EventTypeCard.GIFT_CARD_REMOVED,
  { id: string }
>;
export type GiftCardAdded = Message<
  EventTypeCard.GIFT_CARD_ADDED,
  {
    id: string;
    amounts: number[];
    name: string;
    description: string;
    image_url: string;
  }
>;
export type GiftCardRedeemProcessing = Message<
  EventTypeCard.GIFT_CARD_REDEEM_PROCESSING,
  {}
>;
export type GiftCardRedeemPending = Message<
  EventTypeCard.GIFT_CARD_REDEEM_PENDING,
  {}
>;
export type GiftCardRedeemFailed = Message<
  EventTypeCard.GIFT_CARD_REDEEM_FAILED,
  { id: string; type: string }
>;
export type GiftCardRedeemSucceded = Message<
  EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED,
  { id: string }
>;
export type GiftCardError = Message<
  EventTypeCard.GIFT_CARD_ERROR,
  { type: string }
>;
export type EventCard =
  | GiftCardUpdated
  | GiftCardRemoved
  | GiftCardAdded
  | GiftCardRedeemPending
  | GiftCardRedeemProcessing
  | GiftCardRedeemFailed
  | GiftCardRedeemSucceded
  | GiftCardError;
