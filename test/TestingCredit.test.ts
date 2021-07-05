import { testUtils } from "@keix/message-store-client";
import { v4 } from "uuid";
import { runCredits } from "../src/service/credits";
import {
  runBalanceProjector,
  runBalanceProjectorDelay,
} from "../src/service/credits/projector";
import {
  CommandTypeCredit,
  EventTypeCredit,
} from "../src/service/credits/types";

it("should earn delay credits", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCredit.EARN_DELAYED_CREDIT,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 30,
        dateValidation: new Date(2021, 7, 30),
        delayed: true,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let eventCredit = testUtils.getStreamMessages("creditAccount:command");
    expect(eventCredit).toHaveLength(1);
    let eventScheduler = testUtils.getStreamMessages(
      "commandScheduler:command"
    );
    expect(eventScheduler).toHaveLength(1);
    let eventDelay = testUtils.getStreamMessages("creditAccount");
    expect(eventDelay).toHaveLength(1);
  });
});

it("should return 0 at start", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([]);

  expect(await runBalanceProjector(idAccount1)).toEqual(0);
});

it("should earn a number of credits to a specific account", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCredit.EARN_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 30,
        delayed: false,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCredit.CREDITS_EARNED);
    expect(event[0].data.userId).toEqual(idAccount1);
    expect(event[0].data.amount).toEqual(30);
  });
});

it("should earn a number of credits to a specific account with a transaction id", async () => {
  let idAccount1 = v4();
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCredit.EARN_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 30,
        transactionId: idTrans,
        delayed: false,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCredit.CREDITS_EARNED);
    expect(event[0].data.userId).toEqual(idAccount1);
    expect(event[0].data.amount).toEqual(30);
  });
});

it("shouldn't earn a number of credits to a specific account if the number is negative", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCredit.EARN_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: -30,
        delayed: false,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(0);
  });
});

it("shouldn't use a number of credits of a specific account if isn't up to minimum account", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCredit.USE_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 30,
      },
    },
  ]);

  expect(await runBalanceProjector(idAccount1)).toEqual(0);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCredit.CREDITS_ERROR);
    expect(event[0].data.userId).toEqual(idAccount1);
    expect(event[0].data.type).toEqual("FondiNonSufficienti");
  });
});

it("should use a number of credits to a specific account if the account have the correct balance", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 100,
        delayed: false,
      },
    },
    {
      type: CommandTypeCredit.USE_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 130,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(2);
    expect(event[1].type).toEqual(EventTypeCredit.CREDITS_ERROR);
    expect(event[1].data.userId).toEqual(idAccount1);
    expect(event[1].data.type).toEqual("AmmontoMinimoNonRaggiunto");
  });

  expect(await runBalanceProjector(idAccount1)).toEqual(100);
});

it("should use all the credits available", async () => {
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 150,
        delayed: false,
      },
    },
    {
      type: CommandTypeCredit.USE_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 150,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(2);
    expect(event[1].type).toEqual(EventTypeCredit.CREDITS_USED);
  });

  expect(await runBalanceProjector(idAccount1)).toEqual(0);
});

it("should use a number of credits to a specific account with a transaction id", async () => {
  let idAccount1 = v4();
  let idTrans = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 130,
        transactionId: idTrans,
        delayed: false,
      },
    },
    {
      type: CommandTypeCredit.USE_CREDITS,
      stream_name: "creditAccount:command-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 100,
        transactionId: idTrans,
      },
    },
  ]);

  await testUtils.expectIdempotency(runCredits, () => {
    let event = testUtils.getStreamMessages("creditAccount");
    expect(event).toHaveLength(2);
    expect(event[1].type).toEqual(EventTypeCredit.CREDITS_USED);
    expect(event[1].data.userId).toEqual(idAccount1);
  });

  expect(await runBalanceProjector(idAccount1)).toEqual(30);
});

it("should calculate the balance of a specific account", async () => {
  let idAccount1 = v4();
  let idAccount2 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 30,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount2,
      data: {
        userId: idAccount2,
        amount: 30,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 20,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 50,
        delayed: false,
      },
    },
  ]);

  expect(await runBalanceProjector(idAccount1)).toEqual(100);
});

it("should calculate the balance (mix of use and earn) of a specific account", async () => {
  let idAccount1 = v4();
  let idAccount2 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 70,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount2,
      data: {
        userId: idAccount2,
        amount: 30,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 50,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_USED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 100,
      },
    },
  ]);

  expect(await runBalanceProjector(idAccount1)).toEqual(20);
});

it("should calculate the balance of a specific account only if the deadline is valid", async () => {
  let idAccount1 = v4();
  let timePast = new Date();
  timePast.setMonth(timePast.getMonth() - 14);
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 70,
        delayed: false,
      },
      time: timePast,
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 300,
        delayed: false,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 50,
        delayed: false,
      },
      time: timePast,
    },

    {
      type: EventTypeCredit.CREDITS_USED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        userId: idAccount1,
        amount: 100,
      },
    },
  ]);

  expect(await runBalanceProjector(idAccount1)).toEqual(200);
});
