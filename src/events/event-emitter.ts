import { EventEmitter } from "events";
import { PascalCase } from "type-fest";
import { Events } from ".";
import { APIInteractionResponse } from "discord-api-types/v10";

export type HandlerFunction<Args extends unknown[]> = (
  ...args: [...Args, ...[resolve?: (data: APIInteractionResponse) => void]]
) => unknown | Promise<unknown>;

export type EventsFunctions = {
  [P in keyof Events as P extends string ? `on${PascalCase<P>}` : never]: (
    fn: HandlerFunction<Events[P]>
  ) => BaseEventEmitter;
};

// Typings for the EventClient
export interface BaseEventEmitter extends EventEmitter {
  addListener<K extends keyof Events>(
    name: K,
    fn: HandlerFunction<Events[K]>
  ): this;

  on<K extends keyof Events>(name: K, fn: HandlerFunction<Events[K]>): this;

  once<K extends keyof Events>(name: K, fn: HandlerFunction<Events[K]>): this;

  off<K extends keyof Events>(name: K, fn: HandlerFunction<Events[K]>): this;

  prependListener<K extends keyof Events>(
    name: K,
    fn: HandlerFunction<Events[K]>
  ): this;

  prependOnceListener<K extends keyof Events>(
    name: K,
    fn: HandlerFunction<Events[K]>
  ): this;

  removeAllListeners(eventName: keyof Events | undefined): this;
  removeListener(eventName: keyof Events): this;

  emit<T extends keyof Events>(
    name: T,
    respond: (data: APIInteractionResponse) => void,
    ...args: Events[T]
  ): boolean;
  listenerCount(event: keyof Events): number;
  listeners<T extends keyof Events>(event: T): HandlerFunction<Events[T]>[];
  rawListeners: this["listeners"];
}

export class BaseEventEmitter extends EventEmitter implements BaseEventEmitter {
  constructor() {
    super();
  }
}
