import {EventEmitter} from 'node:events';
import {type CamelCase, type PascalCase} from 'type-fest';
import {REST, type RESTOptions} from '@discordjs/rest';
import {
	type APIInteractionResponse,
	type GatewayDispatchPayload,
	type GatewayInteractionCreateDispatchData,
} from 'discord-api-types/v10';
import TypedEventEmitter from 'typed-emitter';
import {API} from '@discordjs/core';
import {Transport, type TransportOptions} from './transport.mjs';

/**
 * Maps an event name (O['t']) and a Union O and extracts all the union members that have a matching O['t']
 * Example:
 *  type Variant1 = { t: 'type1', myProperty: 1 };
 *  type Variant2 = { t: 'type2', anotherProperty: 2 };
 *  type ExampleUnion = Variant1 | Variant2;
 *
 *  let variant1: ExtractVariant<ExampleUnion, 'type1'>; // Type of variant1 is Variant1
 *  let variant2: ExtractVariant<ExampleUnion, 'type2'>; // Type of variant2 is Variant2
 *
 */
type ExtractVariant<O extends {t: string}, U extends O['t']> = Extract<
	O & {t: Exclude<O['t'], Exclude<O['t'], U>>},
	{t: U}
>;

/**
 * Add intrisics properties to the event, such as `client` and `rest`
 */
export type WithIntrisics<T> = T & {client: Client};

/**
 * CamelCased event name
 */
export type EventName = keyof EventsHandlerArguments;
/**
 * Reprends a handler function with one argument
 */
export type HandlerFunction<Arg extends unknown[]> = (
	...args: Arg
) => PromiseLike<void>;

export type EventTypes = {
	[P in GatewayDispatchPayload['t']]: WithIntrisics<
		ExtractVariant<GatewayDispatchPayload, P>['d']
	>;
};

/**
 * Maps all events from GatewayDispatchPayload['t'] (GatewayDispatchEvents) and maps them to a camelcase event name
 * Also reteives the type of the event using ExtractEvent
 */
export type EventsHandlerArguments = {
	[P in keyof EventTypes as `${CamelCase<P>}`]: HandlerFunction<
		[EventTypes[P]]
	>;
} & {
	interactionCreate: HandlerFunction<
		[
			WithIntrisics<GatewayInteractionCreateDispatchData>,
			(interactionCreate: APIInteractionResponse) => void,
		]
	>;
};

/**
 * Defines all the 'on...' functions on the client
 * This is implemented by a Proxy
 */
export type EventsFunctions = {
	[P in keyof EventsHandlerArguments as P extends string
		? `on${PascalCase<P>}`
		: never]: (fn: EventsHandlerArguments[P]) => Client;
};

/**
 * Defines all the methods known to be implemented
 */
type ClientFunctions = Record<string, unknown> &
	EventsFunctions &
	TypedEventEmitter<EventsHandlerArguments> &
	API;

/**
 * The real extended class is an EventEmitter.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const undefinedClient: new () => ClientFunctions = EventEmitter as any;

/**
 * Nova.js client
 *
 * Used to interact with nova, emits events from nova
 * Example:
 *  client.on('messageCreate', (message) => { console.log('Message received', message.content) });
 *  client.on('interactionCreate', (message) => {  });
 */
export class Client extends undefinedClient {
	public readonly rest: REST;

	private readonly transport: Transport;
	private readonly api: API;

	constructor(options: {
		rest?: Partial<RESTOptions>;
		transport: TransportOptions;
	}) {
		super();
		this.rest = new REST(options.rest).setToken('_');
		this.api = new API(this.rest);

		// Using a proxy to provide the 'on...' functionality
		let self = new Proxy(this, {
			get(self, symbol: keyof typeof Client) {
				const name = symbol.toString();
				if (name.startsWith('on') && name.length > 2) {
					// Get the event name
					const eventName = [name[2].toLowerCase(), name.slice(3)].join(
						'',
					) as EventName;
					return (fn: EventsHandlerArguments[typeof eventName]) =>
						self.on(eventName, fn);
				}

				if (self.api[symbol] && !self[symbol as string]) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return self.api[symbol];
				}

				return self[symbol as string];
			},
		});

		this.transport = new Transport(self, options.transport);

		// This is safe because this event is emitted by the EventEmitter itself.
		this.on('newListener' as any, async (event: EventName) => {
			await this.transport.subscribe(event);
		});

		return self;
	}

	public async start() {
		return this.transport.start();
	}
}
