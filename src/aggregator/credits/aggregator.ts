import { subscribe, combineSubscriber } from "@keix/message-store-client";
import { EventCredits, EventTypeCredit } from "../../service/credits/types";
import Redis from "ioredis";
import { Client } from "@elastic/elasticsearch";
import { runBalanceProjectorDelay } from "../../service/credits/projector";

const index = "usertxleonardo";
let redisClient = new Redis();
const client = new Client({ node: "https://dev.elastic.keix.com" });

interface UserTransaction {
  id: string;
  amount: number;
  userId: string;
  time: Date;
  delayed: boolean;
  dateValidation: Date;
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
  userId: string
): Promise<Boolean> {
  try {
    let result = await client.get({
      index: index,
      id: userId,
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
    (await hasProcessedTransaction(event.data.userId))
  ) {
    return;
  }
  switch (event.type) {
    case EventTypeCredit.CREDITS_EARNED: {
      await redisClient.hincrby(
        "userBalance",
        event.data.userId,
        event.data.amount
      );

      let transaction: UserTransaction = {
        id: event.data.transactionId,
        amount: event.data.amount,
        userId: event.data.userId,
        time: event.time,
        delayed: false,
        dateValidation: event.data.dateValidation,
      };

      await redisClient.hset(
        "userPendingBalance",
        event.data.userId,
        await runBalanceProjectorDelay(event.data.userId)
      );
      if (event.data.delayed) {
        return await client.update({
          index: index,
          id: event.data.transactionId,
          body: transaction,
          refresh: true,
        });
      } else {
        return await client.index({
          index: index,
          id: event.data.transactionId,
          refresh: true,
          body: transaction,
        });
      }
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
        dateValidation: event.data.dateValidation,
      };
      return await client.index({
        index: index,
        id: event.data.transactionId,
        refresh: true,
        body: transaction,
      });
    }
    case EventTypeCredit.CREDITS_USED: {
      await redisClient.hincrby(
        "userBalance",
        event.data.userId,
        -event.data.amount
      );

      let transaction: UserTransaction = {
        id: event.data.transactionId,
        amount: -event.data.amount,
        userId: event.data.userId,
        time: event.time,
        delayed: false,
        dateValidation: event.data.dateValidation,
      };

      return await client.index({
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
