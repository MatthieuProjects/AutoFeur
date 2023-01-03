import { REST } from "@discordjs/rest";
import {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
  InteractionType,
  RESTPostAPIApplicationCommandsJSONBody,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
  Routes,
} from "discord-api-types/v10";
import { rest } from "../rest";

export * from "./builder";

export type HandlerFn = (
  data: APIApplicationCommandInteraction
) => PromiseLike<APIInteractionResponse>;
export type PromiseLike<T> = T | Promise<T>;
export type Command = {
  json: RESTPostAPIChatInputApplicationCommandsJSONBody;
  handler: HandlerFn;
};

export const registerCommands = async (
  commands: Iterable<Command>,
  rest: REST,
  applicationId: string
) => {
  for (const command of commands) {
    await rest.post(Routes.applicationCommands(applicationId), {
      body: command.json as RESTPostAPIApplicationCommandsJSONBody,
    });
  }
};

export const buildHandler = (commands: Iterable<Command>) => {
  let internal: Map<String, Command> = new Map();
  for (const command of commands) {
    internal.set(command.json.name, command);
  }

  return async (event: APIInteraction, reply?: (data: object) => void) => {
    console.log("executing: ", event.data);
    if (event.type === InteractionType.ApplicationCommand) {
      console.log("executing: ", event.data);
      let command = internal.get(event.data.name);

      if (command) {
        let data = await command.handler(event);
        console.log("sending reply", data);

        reply(data);
      }
    }
  };
};
