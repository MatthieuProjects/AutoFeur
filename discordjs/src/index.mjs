// Require the necessary discord.js classes
import { Client, GatewayIntentBits } from 'discord.js';
import { request } from "undici";

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });

// `autofeur_db` service
export const DB = process.env.DB || "http://localhost:3000";

/**
 * Completes a grapheme using the `autofeur_db` service.
 * @param grapheme Grapheme to complete
 * @returns Completed grapheme
 */
export const completeWord = (grapheme) => {
  let resp = request(`${DB}?grapheme=${encodeURIComponent(grapheme)}`);
  return resp.then((x) => {
    if (x.statusCode === 200) {
      return x.body.text();
    }
  });
};

/**
 * Cleans a sentence for usage with this program, strips unwanted chars
 * @param sentence Raw discord sentence
 * @returns The last word without any specials characters
 */
const sanitizeWord = (sentence) => {
  let lastWord = sentence
    .trim()
    .split(" ")
    .slice(-1)[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(/(?:https?|ftp):\/\/[\n\S]+/g, "")
    .replaceAll(/\:([a-z]|[A-Z])+\:/g, "")
    .replaceAll(/(\?|\!|\.|\,|\;)/g, "")
    .replaceAll(/([^A-z])/g, "");
  return lastWord;
};
const anyTrivialCharRegex = /([a-z]|[A-Z])+/g;
const countChars = (str) => ((str || '').match(anyTrivialCharRegex) || []).length;

const specialChannels = [
  "1248226018406301696"
]

const messageAction = async (message) => {
  if (message.author.bot) return;
  const cleanText = sanitizeWord(message.cleanContent);
  if (countChars(cleanText) > 0) {
    let response = await completeWord(cleanText);

    // Ignore if there is no completion
    const shouldReply = (Math.random() > 0.995 || specialChannels.includes(message.channelId) || message.guild == null);
    if ((response || response === "") && shouldReply) {
      message.reply(response);
    }
  }

  if ((message.content.includes("@everyone") && message.guild.id === "1055126989566124083") || specialChannels.includes(message.channelId)) {
    message.reply("https://images-ext-1.discordapp.net/external/R7RnJ3X69cpLftWW0cGu5X4zfMMAaR3ycrAmGKGw7I4/https/media.tenor.com/RRnQfAKupywAAAPo/muppetwiki-muppet-wiki.mp4");
  }
};

client.on("messageCreate", messageAction);
client.on("messageUpdate", messageAction);

client.login(process.env.TOKEN);
