import { connect, ConnectionOptions, NatsConnection } from "nats";
import { EventClient, Events } from ".";
import globRegex from "glob-regex";
import { REST } from "@discordjs/rest";
import {
  APIInteractionResponse,
  GatewayDispatchEvents,
  GatewayDispatchPayload,
  GatewayInteractionCreateDispatch,
  InteractionResponseType,
  Routes,
} from "discord-api-types/v10";
import { CamelCase } from "type-fest";

export type TransportOptions = {
  additionalEvents?: (keyof Events)[];
  nats?: ConnectionOptions;
  queue: string;
};
export class Transport {
  private nats: NatsConnection | null = null;
  private subscription: Map<string, Function> = new Map();
  private queue?: string;
  private events: Set<string> = new Set();

  constructor(private emitter: EventClient, private rest: REST) {}

  public async start(options: TransportOptions) {
    this.nats = await connect(options?.nats);
    this.queue = options.queue;
    if (options.additionalEvents) {
      options.additionalEvents.forEach((a) => this.events.add(a));
    }

    let initial_events = [...this.events];

    for (let subscription of initial_events) {
      await this.subscribe(subscription);
    }
  }

  public async subscribe(event: string) {
    if (!this.nats) {
      console.log("Requesting event " + event);
      this.events.add(event);
      return;
    }
    let dashed = event.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
    event = `nova.cache.dispatch.${dashed.toUpperCase()}`;

    let isAlreadyPresent = [...this.subscription.keys()].reduce(
      (previous, current) => {
        if (previous) return previous;
        let regex = globRegex(current);

        return regex.test(event);
      },
      false
    );

    if (isAlreadyPresent) {
      console.warn("nats subscription already covered.");
      return;
    }

    let regex = globRegex(event);
    [...this.subscription.keys()].map((key) => {
      if (regex.test(key)) {
        let v = this.subscription.get(key);
        if (!v) {
          return;
        }

        console.log(`unsubscribing from ${key}`);
        v();
      }
    });

    this._subTask(event, this.queue || "default_queue");
  }

  private async _subTask(event: string, queue: string) {
    if (!this.nats) {
      throw new Error("nats transporter is not started.");
    }

    console.log(`subscribing to ${event}`);
    let resolve: Function = () => {};
    let task = new Promise((r) => {
      resolve = r;
    });
    let sub = this.nats.subscribe(event, { queue: "" });

    const fn = async () => {
      for await (let data of sub) {
        let string = Buffer.from(data.data).toString("utf-8");
        let d: GatewayDispatchPayload = JSON.parse(string);
        let respond: (repond: APIInteractionResponse) => void | null = null;
        const camelCased = d.t.toLowerCase().replace(/_([a-z])/g, function (g) {
          return g[1].toUpperCase();
        }) as CamelCase<`${typeof d.t}`>;

        if (camelCased === "integrationCreate") {
          let interaction = d.d as GatewayInteractionCreateDispatch["d"];
          respond = (respond: APIInteractionResponse) => {
            if (data.reply) {
              data.respond(Buffer.from(JSON.stringify(respond), "utf-8"));
            } else {
              this.rest.post(
                Routes.webhook(interaction.channel_id, interaction.token),
                { body: respond }
              );
            }
          };
          console.log("expecting reply.");
        }

        this.emitter.emit(camelCased, respond, d.d as any);
      }
    };
    this.subscription.set(event, resolve);

    await Promise.race([task, fn()]);

    console.log(`finished task for ${event}`);
    sub.unsubscribe();
    this.subscription.delete(event);
  }
}
