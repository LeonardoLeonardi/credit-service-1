import { testUtils } from "@keix/message-store-client";
import { v4 } from "uuid";
import { runBalanceProjectorDelay } from "../src/service/credits/projector";
import {
  CommandTypeCredit,
  EventTypeCredit,
} from "../src/service/credits/types";
import {
  runCardExistProjector,
  runVerifyAmountProjector,
  runVerifyDeliveryProjector,
  runVerifyErrorProjector,
  runVerifyPendingProjector,
  runVerifyProcessingProjector,
} from "../src/service/giftCard/projector";
import { CommandTypeCard, EventTypeCard } from "../src/service/giftCard/types";

it("should find a existing card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runCardExistProjector(idCard)).toEqual(true);
});

it("shouldn't find a card if not exist", async () => {
  let idCard = v4();
  let idCardinesistente = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runCardExistProjector(idCardinesistente)).toEqual(false);
});

it("shouldn't find a card if was removed", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REMOVED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
      },
    },
  ]);

  expect(await runCardExistProjector(idCard)).toEqual(false);
});

it("should verify if the amount exists", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runVerifyAmountProjector(idCard, 10)).toEqual(true);
});

it("shouldn't verify an amount if not exists", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runVerifyAmountProjector(idCard, 12)).toEqual(false);
});

it("should return false if isn't in pending state", async () => {
  let idCard = v4();
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runVerifyPendingProjector(idTrans)).toEqual(false);
});

it("should return true if is in pending state", async () => {
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + idTrans,
      data: {},
    },
  ]);

  expect(await runVerifyPendingProjector(idTrans)).toEqual(true);
});

it("should return false if isn't in processing state", async () => {
  let idCard = v4();
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + idTrans,
      data: {
        id: idTrans,
      },
    },
  ]);

  expect(await runVerifyProcessingProjector(idTrans)).toEqual(false);
});

it("should return true if is in processing state", async () => {
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PROCESSING,
      stream_name: "giftCardTransaction-" + idTrans,
      data: { id: idTrans },
    },
  ]);

  expect(await runVerifyProcessingProjector(idTrans)).toEqual(true);
});

it("should return false if isn't yet delivered", async () => {
  let idCard = v4();
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frigo",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + idTrans,
      data: {
        id: idTrans,
      },
    },
  ]);

  expect(await runVerifyDeliveryProjector(idTrans)).toEqual(false);
});

it("should return true if is already delivered", async () => {
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED,
      stream_name: "giftCardTransaction-" + idTrans,
      data: { id: idTrans },
    },
  ]);

  expect(await runVerifyDeliveryProjector(idTrans)).toEqual(true);
});

it("should return false if there isn't an error", async () => {
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED,
      stream_name: "giftCardTransaction-" + idTrans,
      data: { id: idTrans },
    },
  ]);

  expect(await runVerifyErrorProjector(idTrans)).toEqual(false);
});

it("should return true if there is an error", async () => {
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + idTrans,
      data: {
        id: idTrans,
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_FAILED,
      stream_name: "giftCardTransaction-" + idTrans,
      data: {
        id: idTrans,
      },
    },
  ]);

  expect(await runVerifyErrorProjector(idTrans)).toEqual(true);
});
it("should return delayed credit", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED_SCHEDULER,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 30,
        dateValidation: new Date(2021, 7, 30),
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED_SCHEDULER,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 60,
        dateValidation: new Date(2021, 7, 30),
      },
    },
  ]);

  expect(await runBalanceProjectorDelay(idAccount1)).toEqual(90);
});
