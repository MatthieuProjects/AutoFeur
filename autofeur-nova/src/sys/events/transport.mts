import { Buffer } from "node:buffer";
import {
  connect,
  type ConnectionOptions,
  type NatsConnection,
  type Subscription,
} from "nats";
import globRegex from "glob-regex";
import {
  type APIInteractionResponse,
  InteractionResponseType,
  type APIInteractionResponseCallbackData,
  type GatewayDispatchPayload,
  Routes,
} from "discord-api-types/v10";
import { type CamelCase } from "type-fest";
import { type Client, type EventName, type EventsHandlerArguments } from "./index.mjs";

/**
 * Options for the nats transport layer
 */
export type TransportOptions = {
  additionalEvents?: Array<keyof EventsHandlerArguments>;
  nats?: ConnectionOptions;
  queue: string;
};

/**
 * Transport implements all the communication to Nova using Nats
 */
export class Transport {
  // Nats connection
  private nats: NatsConnection | undefined = null;
  // Current subscriptions
  private readonly subscriptions = new Map<string, Subscription>();
  // Current subscribed events
  private readonly events = new Set<EventName>();

  // Creats a new Transport instance.
  constructor(
    private readonly emitter: Client,
    private readonly config: Partial<TransportOptions>
  ) {}

  /**
   * Starts a new nats client.
   */
  public async start() {
    this.nats = await connect(this.config?.nats);

    await Promise.all(
      [...this.events].map(async (eventName) => this.subscribe(eventName))
    );

    if (this.config.additionalEvents) {
      await Promise.all(
        this.config.additionalEvents.map(async (eventName) =>
          this.subscribe(eventName)
        )
      );
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
    const dashed = event.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
    // Construct the topic name used by nova.
    // This **is going to change** as we implement the caching component.
    const topic = `nova.cache.dispatch.${dashed.toUpperCase()}`;

    // To avoid having multiple subscriptions covering this event
    // we check if each of our subscriptions covers this scope.
    const isAlreadyPresent = [...this.subscriptions.keys()].reduce(
      (previous, current) => {
        if (previous) {
          return previous;
        }

        const regex = globRegex(current);

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
    const regex = globRegex(topic);
    for (const key of this.subscriptions.keys()) {
      if (regex.test(key)) {
        const subsciption = this.subscriptions.get(key);
        if (!subsciption) {
          continue;
        }

        console.log(`unsubscribing from ${key}`);
        subsciption.unsubscribe();
      }
    }

    void this._subscriptionTask(topic);
  }

  // Task that monitors the subscription
  // It also listens for a subscription end.
  private async _subscriptionTask(topic: string) {
    if (!this.nats) {
      throw new Error("nats connection is not started");
    }

    console.log(`subscribing to ${topic}`);
    // Create the nats subscription
    const subscription = this.nats.subscribe(topic, {
      queue: this.config.queue || "nova_consumer",
    });
    this.subscriptions.set(topic, subscription);
    // Handle each event in the subscription stream.
    for await (const publish of subscription) {
      try {
        // Decode the payload
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const event: GatewayDispatchPayload = JSON.parse(
          Buffer.from(publish.data).toString("utf8")
        );
        // Transform the event name to a camclCased name
        const camelCasedName = event.t
          .toLowerCase()
          .replace(/_([a-z])/g, (g) => g[1].toUpperCase()) as CamelCase<
          typeof event.t
        >;

        // Since an interaction need a reponse,
        // we need to handle the case where nova is not configured
        // with a webhook endpoint, hence we need to use a post request
        // against webhook execute endpoint with the interaction data.
        if (event.t === "INTERACTION_CREATE") {
          const interaction = event.d;
          const respond = async (respond: APIInteractionResponse) => {
            if (publish.reply) {
              publish.respond(Buffer.from(JSON.stringify(respond), "utf8"));
            } else {
              await this.emitter.rest.post(
                Routes.interactionCallback(interaction.id, interaction.token),
                {
                  body: respond,
                }
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
      } catch {}
    }
  }
}
