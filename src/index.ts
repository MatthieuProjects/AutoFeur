import { EventClient } from "./events/index";
import { buildHandler } from "./handler";
import { commands } from "./commands";
import { rest } from "./rest";

/**
 * We instanciate our nova broken client.
 */
const emitter = new EventClient(rest);

// We register our slash command handler.
emitter.on("interactionCreate", buildHandler(commands));

// We connect ourselves to the nova nats broker.
emitter
  .start({
    additionalEvents: [],
    nats: {
      servers: ["localhost:4222"],
    },
    queue: "nova-worker-common",
  })
  .catch(console.log);
