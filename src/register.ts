import 'source-map-support';
import {REST} from '@discordjs/rest';
import {commands} from './commands';
import {registerCommands} from './sys/handler';

const rest = new REST({
	version: '10',
	api: 'http://localhost:8090/api',
}).setToken('_');

/**
 * We register the commands with discord
 */
(async () => registerCommands(commands, rest, '807188335717384212'))();
