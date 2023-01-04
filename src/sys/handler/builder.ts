import { SlashCommandBuilder } from "@discordjs/builders";
import { Command, HandlerFn } from ".";

/**
 * Simple wrapper around the SlashCommandBuilder provided by Discord.js 
 */
export class CommandBuilder extends SlashCommandBuilder {
  private _handler: HandlerFn;

  constructor() {
    super();
  }

  handler(handler: HandlerFn): this {
    this._handler = handler;
    return this;
  }

  build(): Command {
    return { json: this.toJSON(), handler: this._handler };
  }
}
