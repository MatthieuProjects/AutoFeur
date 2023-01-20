import "source-map-support";
import {
  GatewayMessageCreateDispatch,
  RESTPostAPIChannelMessageJSONBody,
  Routes,
} from "discord-api-types/v10";
import { Client } from "@discordnova/nova-js/src/lib/client.js";
import { request } from "undici";

// `autofeur_db` service
export const DB = process.env.DB || "http://localhost:3000";
// nats broker for connecting to nova
export const NATS = process.env.NATS || "localhost:4222";
// rest endpoint for connecting to nova
export const REST = process.env.REST || "http://localhost:8090/api";

/**
 * Completes a grapheme using the `autofeur_db` service.
 * @param grapheme Grapheme to complete
 * @returns Completed grapheme
 */
export const completeWord = (grapheme: string) =>
  request(`${DB}?grapheme=${encodeURIComponent(grapheme)}`).then((x) =>
    x.body.text()
  );

/**
 * Cleans a sentence for usage with this program, strips unwanted chars
 * @param sentence Raw discord sentence
 * @returns The last word without any specials characters
 */
const cutWord = (sentence: string) => {
  let lastWord = sentence
    .split(" ")
    .slice(-1)[0]
    .replaceAll(/(\s)?([^\x41-\x5A\s^\x61-\x7A^\xC0-\xFF])/g, "");
  return lastWord;
};

/**
 * Nova client for receiving events
 */
const emitter = new Client({
  transport: {
    additionalEvents: [],
    nats: {
      servers: [NATS],
    },
    queue: "autofeur_nova",
  },
  rest: {
    api: REST,
  },
});

/**
 * Handle the message creation event
 */
emitter.on(
  "messageCreate",
  async (message: GatewayMessageCreateDispatch["d"]) => {
    // we shall not repond to bots
    if (message.author.bot) return;
    try {
      // Get the completed word found by the db.
      let response = await completeWord(cutWord(message.content));

      // Ignore if there is no completion
      if (response || response === "") {
        // Respond to the message.
        await emitter.rest.post(Routes.channelMessages(message.channel_id), {
          body: {
            content: response,
            message_reference: { message_id: message.id },
          } as RESTPostAPIChannelMessageJSONBody,
        });
      }
    } catch (e) {}
  }
);

// Start the service (listening for events.)
(async () => await emitter.start())();
