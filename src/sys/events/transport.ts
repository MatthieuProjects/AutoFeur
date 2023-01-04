import { connect, ConnectionOptions, NatsConnection, Subscription } from "nats";
import {
  Client,
  EventName,
  EventTypes,
  EventsHandlerArguments,
  WithIntrisics,
} from ".";
import globRegex from "glob-regex";
import {
  APIInteraction,
  APIInteractionResponse,
  APIInteractionResponseCallbackData,
  GatewayDispatchPayload,
  GatewayInteractionCreateDispatch,
  Routes,
} from "discord-api-types/v10";
import { CamelCase } from "type-fest";

/**
 * Options for the nats transport layer
 */
export type TransportOptions = {
  additionalEvents?: (keyof EventsHandlerArguments)[];
  nats?: ConnectionOptions;
  queue: string;
};

/**
 * Transport implements all the communication to Nova using Nats
 */
export class Transport {
  // Nats connection
  private nats: NatsConnection | null = null;
  // Current subscriptions
  private subscriptions: Map<string, Subscription> = new Map();
  // Current subscribed events
  private events: Set<EventName> = new Set();

  // Creats a new Transport instance.
  constructor(
    private emitter: Client,
    private config: Partial<TransportOptions>
  ) {}

  /**
   * Starts a new nats client.
   */
  public async start() {
    this.nats = await connect(this.config?.nats);

    for (let eventName of this.events) {
      await this.subscribe(eventName);
    }
    if (this.config.additionalEvents) {
      for (let eventName of this.config.additionalEvents) {
        await this.subscribe(eventName);
      }
    }
  }

  /**
   * Subscribe to a new topic
   * @param event Event to subscribe to
   * @returns
   */
  public async subscribe(event: EventName) {
    // If nats is not connected, we simply request to subscribe to it at startup
    if (!this.nats) {
      console.log("Requesting event " + event);
      this.events.add(event);
      return;
    }

    // Since the event names used by this library are camelCase'd we need to
    // re-transform it to the UPPER_CASE used by nova.
    let dashed = event.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
    // Construct the topic name used by nova.
    // This **is going to change** as we implement the caching component.
    let topic = `nova.cache.dispatch.${dashed.toUpperCase()}`;

    // To avoid having multiple subscriptions covering this event
    // we check if each of our subscriptions covers this scope.
    let isAlreadyPresent = [...this.subscriptions.keys()].reduce(
      (previous, current) => {
        if (previous) return previous;
        let regex = globRegex(current);

        return regex.test(topic);
      },
      false
    );

    // We abord the subscriptions if it's already covered.
    if (isAlreadyPresent) {
      console.warn("nats subscription already covered.");
      return;
    }

    // We remove all the subscriptions that are covered by out current subsciptions.
    let regex = globRegex(topic);
    [...this.subscriptions.keys()].map((key) => {
      if (regex.test(key)) {
        let subsciption = this.subscriptions.get(key);
        if (!subsciption) {
          return;
        }

        console.log(`unsubscribing from ${key}`);
        subsciption.unsubscribe();
      }
    });

    this._subscriptionTask(topic);
  }

  // Task that monitors the subscription
  // It also listens for a subscription end.
  private async _subscriptionTask(topic: string) {
    if (!this.nats) {
      throw new Error("nats connection is not started");
    }

    console.log(`subscribing to ${topic}`);
    // Create the nats subscription
    let subscription = this.nats.subscribe(topic, { queue: this.config.queue });
    this.subscriptions.set(topic, subscription);
    // Handle each event in the subscription stream.
    for await (let publish of subscription) {
      try {
        // Decode the payload
        let event: GatewayDispatchPayload = JSON.parse(
          Buffer.from(publish.data).toString("utf-8")
        );
        // Transform the event name to a camclCased name
        const camelCasedName = event.t
          .toLowerCase()
          .replace(/_([a-z])/g, function (g) {
            return g[1].toUpperCase();
          }) as CamelCase<typeof event.t>;

        // Since an interaction need a reponse,
        // we need to handle the case where nova is not configured
        // with a webhook endpoint, hence we need to use a post request
        // against webhook execute endpoint with the interaction data.
        if (event.t === "INTERACTION_CREATE") {
          let interaction = event.d;
          let respond = async (respond: APIInteractionResponseCallbackData) => {
            if (publish.reply) {
              publish.respond(Buffer.from(JSON.stringify(respond), "utf-8"));
            } else {
              await this.emitter.interactions.reply(
                interaction.id,
                interaction.token,
                respond
              );
            }
          };
          // Emit the
          this.emitter.emit(
            camelCasedName,
            { ...event.d, client: this.emitter },
            respond
          );
        } else {
          // Typescript refuses to infer this, whyyy
          this.emitter.emit(camelCasedName, {
            ...event.d,
            client: this.emitter,
          } as any);
        }
      } catch (e) {}
    }
  }
}
