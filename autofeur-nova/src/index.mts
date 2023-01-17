import "source-map-support";
import { Client } from "./sys/events/client.mjs";
import {
  GatewayMessageCreateDispatch,
  RESTPostAPIChannelMessageJSONBody,
  Routes,
} from "discord-api-types/v10";
import { match } from "./algo.mjs";

(async () => {
  const emitter = new Client({
    transport: {
      additionalEvents: [],
      nats: {
        servers: ["localhost:4222"],
      },
      queue: "nova-worker-common",
    },
    rest: {
      api: "http://localhost:8090/api",
    },
  });

  emitter.on(
    "messageCreate",
    async (message: GatewayMessageCreateDispatch["d"]) => {
      if (message.author.id === "807188335717384212") return;
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
