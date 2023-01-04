import {
  type APIApplicationCommandInteraction,
  type APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  APIUser,
  MessageFlags,
} from "discord-api-types/v10";
import { CommandBuilder, type HandlerFn } from "../sys/handler";

type Messages = {
  low: [];
  high: [];
  average: [];
  loveMessage: [APIUser, APIUser, number];
  sameUser: [];
};

type Locales = {
  [K in keyof Messages]: Partial<
    Record<
      APIApplicationCommandInteraction["locale"] | "_",
      (...args: Messages[K]) => string
    >
  >;
};

const locales: Locales = {
  low: {
    fr: () => "déteste",
    _: () => "hates",
  },
  average: {
    fr: () => "est compatible avec",
    _: () => "is compatible with",
  },
  high: {
    fr: () => "est fou/folle de",
    _: () => "is in love with",
  },

  sameUser: {
    fr: () => "Vous devez choisir deux utilisateurs distincts",
    _: () => "You can't calculate love between the same user!",
  },

  loveMessage: {
    fr: (user1: APIUser, user2: APIUser, percentage: number) =>
      `**${percentage}%**! ${user1.username}#${user1.discriminator} ${resolve(
        percentage > 80 ? "high" : percentage <= 35 ? "low" : "average",
        "fr"
      )} ${user2.username}#${user2.discriminator}`,
    _: (user1: APIUser, user2: APIUser, percentage: number) =>
      `**${percentage}%**! ${user1.username}#${user1.discriminator} ${resolve(
        percentage > 80 ? "high" : percentage <= 35 ? "low" : "average",
        "_"
      )} ${user2.username}#${user2.discriminator}`,
  },
};

const resolve = <T extends keyof Messages>(
  message: T,
  locale: APIApplicationCommandInteraction["locale"] | "_",
  ...args: Messages[T]
) =>
  (
    (locales[message][locale] ?? locales[message]._) as (
      ...args: Messages[T]
    ) => string
  )(...args);

const handler: HandlerFn = async ({
  data,
  locale,
}: APIApplicationCommandInteraction): Promise<APIInteractionResponse> => {
  if (
    data.type === ApplicationCommandType.ChatInput &&
    data.options[0].name === "user1" &&
    data.options[0].type === ApplicationCommandOptionType.User &&
    data.options[1].name === "user2" &&
    data.options[1].type === ApplicationCommandOptionType.User
  ) {
    let user1 = data.resolved.users[data.options[0].value];
    let user2 = data.resolved.users[data.options[1].value];

    if (user1.id === user2.id) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
          content: resolve("sameUser", locale),
        },
      };
    }

    let percentage = Math.round(Math.random() * 100);
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: resolve("loveMessage", locale, user1, user2, percentage),
      },
    };
  }
};

export const loveCalculator = new CommandBuilder()
  .setName("calculate-love")
  .handler(handler)
  .setDescription("Calcule the love compatibility between two users")
  .addUserOption((option) =>
    option
      .setName("user1")
      .setDescription("The first user of the couple")
      .setDescriptionLocalization("fr", "Le premier membre du couple")
      .setNameLocalization("fr", "premier_utilisateur")
      .setNameLocalization("en-US", "first_user")
      .setRequired(true)
  )
  .addUserOption((option) =>
    option
      .setName("user2")
      .setDescription("The second user of the couple")
      .setDescriptionLocalization("fr", "Le deuxième membre du couple")
      .setNameLocalization("fr", "second_utilisateur")
      .setNameLocalization("en-US", "second_user")
      .setRequired(true)
  )
  .setDescriptionLocalizations({
    fr: "Calcule l'amour entre deux membres",
  })
  .setNameLocalization("fr", "calculer-compatibilite")
  .setDMPermission(false)
  .build();
