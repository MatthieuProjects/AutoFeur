import "source-map-support";
import {
  GatewayMessageCreateDispatch,
  RESTPostAPIChannelMessageJSONBody,
  Routes,
} from "discord-api-types/v10";
import { match } from "./algo.mjs";
import { Client } from "@discordnova/nova-js/src/lib/client.js";

export const NATS = process.env.NATS || "localhost:4222";
export const REST = process.env.REST || "http://localhost:8090/api";

(async () => {
  const emitter = new Client({
    transport: {
      additionalEvents: [],
      nats: {
        servers: [NATS],
      },
      queue: "nova-worker-common",
    },
    rest: {
      api: REST,
    },
  });

  emitter.on(
    "messageCreate",
    async (message: GatewayMessageCreateDispatch["d"]) => {
      let response = await match(message.content);
      if (response) {
        await emitter.rest.post(Routes.channelMessages(message.channel_id), {
          body: {
            content: response,
            message_reference: { message_id: message.id },
          } as RESTPostAPIChannelMessageJSONBody,
        });
      }
    }
  );

  // We connect ourselves to the nova nats broker.
  await emitter.start();
})();
