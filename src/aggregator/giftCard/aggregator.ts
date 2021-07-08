import {
  subscribe,
  Message,
  readLastMessage,
  combineSubscriber,
} from "@keix/message-store-client";
import { EventCard, EventTypeCard } from "../../service/giftCard/types";
import { Client } from "@elastic/elasticsearch";

const index = "giftcardleonardo";

const client = new Client({ node: "https://dev.elastic.keix.com" });

export async function getCardAmounts(cardId: string) {
  try {
    const result = await client.get({
      index: index,
      id: cardId,
    });
    return result.body._source.amounts;
  } catch (err) {
    return null;
  }
}
export async function getCard(cardId: string) {
  try {
    const result = await client.get({
      index: index,
      id: cardId,
    });
    return result.body._source;
  } catch (err) {
    return null;
  }
}
/* .catch((err) => console.log(err)) */
/* export async function getTransactions(
  userId: string
): Promise<UserTransaction[]> {
  let keyUser = `creditAccount/${userId}`;
  let transactrionsList = await redisClient.lrange(
    keyUser,
    0,
    await redisClient.llen(keyUser)
  );

  return transactrionsList.map((transaction) => {
    return JSON.parse(transaction);
  });
} */

/* export async function hasProcessedTransaction(
  id: string,
  transactionId: string
): Promise<boolean> {
  let transactions = await getTransactions(id);
  return (
    transactions.find((d: { id: string }) => d.id == transactionId) != null
  );
// questo if deve andare sopra lo switch
if (
    (event.type == EventTypeCredit.CREDITS_EARNED ||
      event.type == EventTypeCredit.CREDITS_USED) &&
    (await hasProcessedTransaction(event.data.id, event.data.transactionId))
  ) {
    return;
  }

} */
async function handler(event: EventCard) {
  switch (event.type) {
    case EventTypeCard.GIFT_CARD_ADDED: {
      await client.index({
        index: index,
        id: event.data.id,
        body: {
          id: event.data.id,
          name: event.data.name,
          description: event.data.description,
          amounts: event.data.amounts,
        },
        refresh: true,
      });
      return;
    }

    case EventTypeCard.GIFT_CARD_UPDATED: {
      await client.update({
        index: index,
        id: event.data.id,
        body: {
          doc: {
            amounts: event.data.amounts,
          },
        },
        refresh: true,
      });
      return;
    }
    case EventTypeCard.GIFT_CARD_REMOVED: {
      client.delete({
        index: index,
        id: event.data.id,
        refresh: true,
      });
      return;
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
