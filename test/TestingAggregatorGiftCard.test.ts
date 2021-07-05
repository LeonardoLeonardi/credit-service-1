import { testUtils } from "@keix/message-store-client";
import { v4 } from "uuid";
import {
  getCard,
  getCardAmounts,
  run,
} from "../src/aggregator/giftCard/aggregator";
import { CommandTypeCard, EventTypeCard } from "../src/service/giftCard/types";

it("should add a giftcard and return amounts", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "creditAccount-" + idCard,
      data: {
        id: idCard,
        name: "amazon",
        description: "",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  run();

  await testUtils.waitForExpect(async () => {
    expect(await getCardAmounts(idCard)).toEqual([5, 10, 20, 30, 50]);
  });
});

it("should return null ", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([]);

  run();
  await testUtils.waitForExpect(async () => {
    expect(await getCardAmounts(idCard)).toEqual(null);
  });
});

it("should update amounts", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "creditAccount-" + idCard,
      data: {
        id: idCard,
        name: "amazon",
        description: "",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_UPDATED,
      stream_name: "creditAccount-" + idCard,
      data: {
        id: idCard,
        amounts: [10, 15, 25, 35, 55],
      },
    },
  ]);

  run();

  await testUtils.waitForExpect(async () => {
    expect(await getCardAmounts(idCard)).toEqual([10, 15, 25, 35, 55]);
  });
});

it("should remove a giftcard", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "creditAccount-" + idCard,
      data: {
        id: idCard,
        name: "amazon",
        description: "",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REMOVED,
      stream_name: "creditAccount-" + idCard,
      data: {
        id: idCard,
      },
    },
  ]);

  run();

  await testUtils.waitForExpect(async () => {
    expect(await getCard(idCard)).toEqual(null);
  });
});
