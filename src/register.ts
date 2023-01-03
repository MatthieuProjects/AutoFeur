import { commands } from "./commands";
import { registerCommands } from "./handler";
import { rest } from "./rest";

/**
 * We register the commands with discord
 */
registerCommands(commands, rest, "807188335717384212");