import { EventClient } from "./events/index";
import {
  RESTPostAPIChannelMessageResult,
  Routes,
} from "discord-api-types/v10";
import { rest } from "./rest";
import { buildHandler } from "./handler";
import { commands } from "./commands";

const emitter = new EventClient();
emitter.on("interactionCreate", buildHandler(commands));

emitter.on("messageCreate", async (message) => {
  console.log(message);
  if (message.content.toLowerCase() == "salut") {
    await rest.post(Routes.channelMessages(message.channel_id), {
      body: {
        content: `Salut <@${message.author.id}> :wink:`,
      },
    });
  } else if (message.content.toLocaleLowerCase() == "~ping") {
    let t1 = new Date().getTime();
    let sentMessage = <RESTPostAPIChannelMessageResult>await rest.post(
      Routes.channelMessages(message.channel_id),
      {
        body: {
          content: `Calcul du ping...`,
        },
      }
    );
    let time = new Date().getTime() - t1;

    await rest.patch(
      Routes.channelMessage(message.channel_id, sentMessage.id),
      {
        body: {
          content: `Le ping de <@${sentMessage.author.id}> est de \`${time}ms\``,
        },
      }
    );
  }
});

emitter
  .start({
    additionalEvents: [],
    nats: {
      servers: ["localhost:4222"],
    },
    queue: "nova-worker-common",
  })
  .catch(console.log);
