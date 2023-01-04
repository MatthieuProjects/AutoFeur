import {SlashCommandBuilder} from '@discordjs/builders';
import {type Command, type HandlerFn} from '.';

/**
 * Simple wrapper around the SlashCommandBuilder provided by Discord.js
 */
export class CommandBuilder extends SlashCommandBuilder {
	private _handler: HandlerFn;

	handler(handler: HandlerFn): this {
		this._handler = handler;
		return this;
	}

	build(): Command {
		return {json: this.toJSON(), handler: this._handler};
	}
}
