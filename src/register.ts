import "source-map-support";
import { REST } from "@discordjs/rest";
import { commands } from "./commands";
import { registerCommands } from "./sys/handler";
import { RESTGetAPIUserResult, Routes } from "discord-api-types/v10";

const rest = new REST({
  version: "10",
  api: "http://localhost:8090/api",
}).setToken("_");

/**
 * We register the commands with discord
 */
(async () => {
  let self = (await rest.get(Routes.user("@me"))) as RESTGetAPIUserResult;
  registerCommands(commands, rest, self.id);
})();
