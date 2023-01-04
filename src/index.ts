import { Client } from "./sys/events";
import { buildHandler } from "./sys/handler";
import { commands } from "./commands";

/**
 * We instanciate our nova broker client.
 */
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

// We register our slash command handler.
emitter.on("interactionCreate", buildHandler(commands));

// Simple message handler
emitter.on("messageCreate", (message) => {
  if (message.content === "~ping") {
    message.client.channels.createMessage(message.channel_id, {
      content: `Bonjour! <@${message.author.id}>`,
    });
  }
});

// We connect ourselves to the nova nats broker.
emitter.start().catch(console.log);
