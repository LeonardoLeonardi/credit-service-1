import { testUtils } from "@keix/message-store-client";
import { v4 } from "uuid";
import {
  getBalance,
  run,
  getTransactions,
  getBalanceDelayed,
} from "../src/aggregator/credits/aggregator";
import {
  CommandTypeCredit,
  EventTypeCredit,
} from "../src/service/credits/types";

it("should return a positive balance", async () => {
  let idAccount1 = v4();
  let idTrans1 = v4();
  let idTrans2 = v4();
  let dateToday = new Date();
  let dateNew = new Date(2021, 6, 28);
  let datePast = new Date(2021, 5, 28);
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      time: dateNew,
      data: {
        userId: idAccount1,
        amount: 30,
        transactionId: idTrans1,
        dateValidation: dateToday,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      time: datePast,
      data: {
        userId: idAccount1,
        amount: 30,
        transactionId: idTrans2,
        dateValidation: dateToday,
      },
    },
  ]);

  await testUtils.expectIdempotency(run, async () => {
    expect(await getBalance(idAccount1)).toEqual("60");
    let res = await getTransactions(idAccount1);
    expect(res[0]._source).toEqual({
      id: idTrans2,
      amount: 30,
      userId: idAccount1,
      time: datePast.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
    expect(res[1]._source).toEqual({
      id: idTrans1,
      amount: 30,
      userId: idAccount1,
      time: dateNew.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
  });
});

it("should return a 0 balance", async () => {
  let idAccount1 = v4();
  let idTrans1 = v4();
  let idTrans2 = v4();
  let dateToday = new Date();
  let dateNew = new Date(2021, 6, 28);
  let datePast = new Date(2021, 5, 28);
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      time: dateNew,
      data: {
        userId: idAccount1,
        amount: 300,
        transactionId: idTrans1,
        dateValidation: dateToday,
      },
    },
    {
      type: EventTypeCredit.CREDITS_USED,
      stream_name: "creditAccount-" + idAccount1,
      time: datePast,

      data: {
        userId: idAccount1,
        amount: 300,
        transactionId: idTrans2,
        dateValidation: dateToday,
      },
    },
  ]);
  await testUtils.expectIdempotency(run, async () => {
    expect(await getBalance(idAccount1)).toEqual("0");
    let res = await getTransactions(idAccount1);
    expect(res[0]._source).toEqual({
      id: idTrans2,
      amount: -300,
      userId: idAccount1,
      time: datePast.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
    expect(res[1]._source).toEqual({
      id: idTrans1,
      amount: 300,
      userId: idAccount1,
      time: dateNew.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
  });
});

it("should return balance", async () => {
  let idAccount1 = v4();
  let idTrans1 = v4();
  let idTrans2 = v4();
  let idTrans3 = v4();
  let dateToday = new Date();
  let dateNew = new Date(2021, 6, 28);
  let dateNew2 = new Date(2021, 6, 27);
  let datePast = new Date(2021, 5, 28);
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      time: dateNew,
      data: {
        userId: idAccount1,
        amount: 300,
        transactionId: idTrans1,
        dateValidation: dateToday,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      time: datePast,
      data: {
        userId: idAccount1,
        amount: 100,
        transactionId: idTrans2,
        dateValidation: dateToday,
      },
    },
    {
      type: EventTypeCredit.CREDITS_USED,
      stream_name: "creditAccount-" + idAccount1,
      time: dateNew2,
      data: {
        userId: idAccount1,
        amount: 200,
        transactionId: idTrans3,
        dateValidation: dateToday,
      },
    },
  ]);
  await testUtils.expectIdempotency(run, async () => {
    expect(await getBalance(idAccount1)).toEqual("200");
    let res = await getTransactions(idAccount1);
    expect(res[0]._source).toEqual({
      id: idTrans2,
      amount: 100,
      userId: idAccount1,
      time: datePast.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
    expect(res[1]._source).toEqual({
      id: idTrans3,
      amount: -200,
      userId: idAccount1,
      time: dateNew2.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
    expect(res[2]._source).toEqual({
      id: idTrans1,
      amount: 300,
      userId: idAccount1,
      time: dateNew.toISOString(),
      delayed: false,
      dateValidation: dateToday.toISOString(),
    });
  });
});
it("should return balance delayed", async () => {
  let idAccount1 = v4();
  let idTrans1 = v4();
  let idTrans2 = v4();
  let dateToday = new Date();

  let dateNew = new Date(2021, 6, 28);
  let datePast = new Date(2021, 5, 28);
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      time: dateNew,
      data: {
        userId: idAccount1,
        amount: 100,
        transactionId: idTrans1,
        dateValidation: dateToday,
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED_SCHEDULER,
      stream_name: "creditAccount-" + idAccount1,
      time: datePast,

      data: {
        userId: idAccount1,
        amount: 300,
        dateValidation: new Date(2021, 7, 30),
      },
    },
    {
      type: EventTypeCredit.CREDITS_EARNED_SCHEDULER,
      stream_name: "creditAccount-" + idAccount1,
      time: datePast,

      data: {
        userId: idAccount1,
        amount: 300,
        dateValidation: new Date(2021, 7, 30),
      },
    },
  ]);
  await testUtils.expectIdempotency(run, async () => {
    expect(await getBalance(idAccount1)).toEqual("100");
    expect(await getBalanceDelayed(idAccount1)).toEqual("600");
  });
});
