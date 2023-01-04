import {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
} from "discord-api-types/v10";
import { CommandBuilder, HandlerFn } from "../sys/handler";
import { promise } from "ping";

type Messages = {
  latency_message: [number];
  failure_message: [string];
};

type Locales = {
  [K in keyof Messages]: Partial<
    Record<
      APIApplicationCommandInteraction["locale"] & "_",
      (...args: Messages[K]) => string
    >
  >;
};

const locales: Locales = {
  latency_message: {
    fr: (latency: number) =>
      `**Temps de complétion du ping:** \`${latency}ms\``,
    _: (latency: number) => `**Ping time:** \`${latency}ms\``,
  },
  failure_message: {
    _: (error: string) => `**The host seems unreachable** \`\`\`${error}\`\`\``,
  },
};

const resolve = (
  msg: keyof Messages,
  locale: APIApplicationCommandInteraction["locale"],
  ...args: Messages[typeof msg]
) => (locales[msg][locale] ?? locales[msg]["_"])(args);

const handler: HandlerFn = async (
  data: APIApplicationCommandInteraction
): Promise<APIInteractionResponse> => {
  if (
    data.data.type === ApplicationCommandType.ChatInput &&
    data.data.options[0].name === "host" &&
    data.data.options[0].type === ApplicationCommandOptionType.String
  ) {
    let host = data.data.options[0].value;
    let response = await promise.probe(host);

    if (response.alive) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: resolve("latency_message", data.locale, response.avg),
        },
      };
    } else {
      let output = response.output;
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: resolve("failure_message", data.locale, output),
        },
      };
    }
  }
};

export const ping = new CommandBuilder()
  .setName("ping")
  .handler(handler)
  .setDescription("Measure the bot network latency")
  .addStringOption((option) =>
    option
      .setName("host")
      .setDescription("The host to test pings against")
      .setRequired(true)
  )
  .setDescriptionLocalizations({
    fr: "Mesure la latence reseau du bot",
  })
  .setDMPermission(false)
  .build();
