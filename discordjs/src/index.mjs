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
const re = /([a-z]|[A-Z])+/g;
const countChars = (str) => ((str || '').match(re) || []).length;

const specialChannels = [
  "1248226018406301696"
]

const messageAction = async (message) => {
  if (message.author.bot) return;
  const cleanText = sanitizeWord(message.cleanContent);
  if (countChars(cleanText) > 0) {
    let response = await completeWord(cleanText);

    // Ignore if there is no completion
    const shouldReply = (Math.random() > 0.98 || specialChannels.includes(message.channelId) || message.guild == null);
    if ((response || response === "") && shouldReply) {
      message.reply(response);
    }
  }
};

client.on("messageCreate", messageAction);
client.on("messageUpdate", messageAction);

client.login(process.env.TOKEN);
