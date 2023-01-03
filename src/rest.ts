require('source-map-support').install();
import { REST } from "@discordjs/rest";

export const rest = new REST({
  version: "10",
  headers: { Authorization: "" },
  api: "http://localhost:8090/api",
}).setToken("_");
