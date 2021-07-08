import { subscribe, combineSubscriber } from "@keix/message-store-client";
import { EventCredits, EventTypeCredit } from "../../service/credits/types";
import Redis from "ioredis";
import { Client } from "@elastic/elasticsearch";
import {
  runBalanceProjector,
  runBalanceProjectorDelay,
} from "../../service/credits/projector";

const index = "usertxleonardo";
let redisClient = new Redis();
const client = new Client({ node: "https://dev.elastic.keix.com" });

interface UserTransaction {
  id: string;
  amount: number;
  userId: string;
  time: Date;
  delayed: boolean;
  creditDate: Date;
}

let direction = "asc";

export async function getBalance(userId: string) {
  return await redisClient.hget("userBalance", userId);
}
export async function getBalanceDelayed(userId: string) {
  return await redisClient.hget("userPendingBalance", userId);
}
export async function getTransactions(userId: string) {
  return await (
    await client.search({
      index: index,
      body: {
        sort: [{ time: { order: direction } }],
        query: {
          match: {
            userId: userId,
          },
        },
      },
    })
  ).body.hits.hits;
}

export async function hasProcessedTransaction(
  transactionId: string
): Promise<Boolean> {
  try {
    let result = await client.get({
      index: index,
      id: transactionId,
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function handler(event: EventCredits) {
  if (
    (event.type == EventTypeCredit.CREDITS_EARNED ||
      event.type == EventTypeCredit.CREDITS_USED ||
      event.type == EventTypeCredit.CREDITS_EARNED_SCHEDULER) &&
    (await hasProcessedTransaction(event.data.transactionId))
  ) {
    return;
  }
  switch (event.type) {
    case EventTypeCredit.CREDITS_EARNED: {
      //Si deve mettere hset con il projector e aggiungere refresh se da problemi di version conflict
      await redisClient.hset(
        "userBalance",
        event.data.userId,
        await runBalanceProjector(event.data.userId)
      );

      let transaction: UserTransaction = {
        id: event.data.transactionId,
        amount: event.data.amount,
        userId: event.data.userId,
        time: event.time,
        delayed: false,
        /* Cambiare dateValidation */ creditDate: event.data.creditDate,
      };

      await redisClient.hset(
        "userPendingBalance",
        event.data.userId,
        await runBalanceProjectorDelay(event.data.userId)
      );
      return client.index({
        index: index,
        id: event.data.transactionId,
        refresh: true,
        body: transaction,
      });
    }
    case EventTypeCredit.CREDITS_EARNED_SCHEDULER: {
      await redisClient.hset(
        "userPendingBalance",
        event.data.userId,
        await runBalanceProjectorDelay(event.data.userId)
      );
      let transaction: UserTransaction = {
        id: event.data.transactionId,
        amount: event.data.amount,
        userId: event.data.userId,
        time: event.time,
        delayed: true,
        creditDate: event.data.creditDate,
      };
      return await client.index({
        index: index,
        id: event.data.transactionId,
        refresh: true,
        body: transaction,
      });
    }
    case EventTypeCredit.CREDITS_USED: {
      await redisClient.hset(
        "userBalance",
        event.data.userId,
        await runBalanceProjector(event.data.userId)
      );

      let transaction: UserTransaction = {
        id: event.data.transactionId,
        amount: -event.data.amount,
        userId: event.data.userId,
        time: event.time,
        delayed: false,
        creditDate: event.data.creditDate,
      };

      return client.index({
        index: index,
        id: event.data.transactionId,
        refresh: true,
        body: transaction,
      });

      /* let key = `creditAccount/${event.data.id}`;
      return redisClient.rpush(key, JSON.stringify(transaction)); */
    }
  }
}

export async function run() {
  return combineSubscriber(
    subscribe(
      {
        streamName: "creditAccount",
      },
      handler
    )
  );
}
