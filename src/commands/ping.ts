import {
	type APIApplicationCommandInteraction,
	type APIInteractionResponse,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	InteractionResponseType,
} from 'discord-api-types/v10.js';
import {promise} from 'ping';
import {CommandBuilder, type HandlerFn} from '../sys/handler';

type Messages = {
	latencyMessage: [number];
	failureMessage: [string];
};

type Locales = {
	[K in keyof Messages]: Partial<
		Record<
			APIApplicationCommandInteraction['locale'] | '_',
			(...args: Messages[K]) => string
		>
	>;
};

const locales: Locales = {
	latencyMessage: {
		fr: (latency: number) =>
			`**Temps de complétion du ping:** \`${latency}ms\``,
		_: (latency: number) => `**Ping time:** \`${latency}ms\``,
	},
	failureMessage: {
		_: (error: string) => `**The host seems unreachable** \`\`\`${error}\`\`\``,
	},
};

const resolve = <T extends keyof Messages>(
	message: T,
	locale: APIApplicationCommandInteraction['locale'],
	...args: Messages[T]
) =>
	(
		(locales[message][locale] ?? locales[message]._) as (
			...args: Messages[T]
		) => string
	)(...args);

const handler: HandlerFn = async (
	data: APIApplicationCommandInteraction,
): Promise<APIInteractionResponse> => {
	if (
		data.data.type === ApplicationCommandType.ChatInput &&
		data.data.options[0].name === 'host' &&
		data.data.options[0].type === ApplicationCommandOptionType.String
	) {
		const host = data.data.options[0].value;
		const response = await promise.probe(host);

		if (response.alive) {
			return {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: resolve(
						'latencyMessage',
						data.locale,
						Number.parseInt(response.avg, 10),
					),
				},
			};
		}

		const output = response.output;
		return {
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: resolve('failureMessage', data.locale, output),
			},
		};
	}
};

export const ping = new CommandBuilder()
	.setName('ping')
	.handler(handler)
	.setDescription('Measure the bot network latency')
	.addStringOption((option) =>
		option
			.setName('host')
			.setDescription('The host to test pings against')
			.setRequired(true),
	)
	.setDescriptionLocalizations({
		fr: 'Mesure la latence reseau du bot',
	})
	.setDMPermission(false)
	.build();
