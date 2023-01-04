import {type REST} from '@discordjs/rest';
import {
	type APIApplicationCommandInteraction,
	type APIInteraction,
	InteractionType,
	type RESTPostAPIApplicationCommandsJSONBody,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	Routes,
	type APIInteractionResponse,
} from 'discord-api-types/v10';

export * from './builder';

export type PromiseLike<T> = T | Promise<T>;
/**
 * A simple function that executes a slash command.
 */
export type HandlerFn = (
	data: APIApplicationCommandInteraction,
) => PromiseLike<APIInteractionResponse>;

export type Command = {
	json: RESTPostAPIChatInputApplicationCommandsJSONBody;
	handler: HandlerFn;
};

/**
 * Register all the commands to discord
 * @param commands List of commands to register
 * @param rest Rest api instance
 * @param applicationId Current application id
 */
export const registerCommands = async (
	commands: Iterable<Command>,
	rest: REST,
	appId: string,
) => {
	await rest.put(Routes.applicationCommands(appId), {
		body: [...commands].map(
			(x) => x.json,
		) as RESTPostAPIApplicationCommandsJSONBody[],
	});
};

/**
 * Creates a new handler to handle the slash commands.
 * @param commands List of commands to handle
 * @returns Handler function
 */
export const buildHandler = (commands: Iterable<Command>) => {
	const internal = new Map<string, Command>();
	for (const command of commands) {
		internal.set(command.json.name, command);
	}

	return async (
		event: APIInteraction,
		reply?: (data: APIInteractionResponse) => void,
	) => {
		console.log('executing:', event.data);
		if (event.type === InteractionType.ApplicationCommand) {
			console.log('executing:', event.data);
			const command = internal.get(event.data.name);

			if (command) {
				const data = await command.handler(event);
				console.log('sending reply', data);

				reply(data);
			}
		}
	};
};
