// Require the necessary discord.js classes
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { request } from "undici";

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

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
const cutWord = (sentence) => {
  let lastWord = sentence
    .split(" ")
    .slice(-1)[0]
    .replaceAll(/(\s)?([^\x41-\x5A\s^\x61-\x7A^\xC0-\xFF])/g, "")
    .replaceAll(/(?:https?|ftp):\/\/[\n\S]+/g, '');
  return lastWord;
};

client.on("messageCreate", async (message) => {
  // we shall not repond to bots
  if (message.author.bot) return;

  try {
    // Get the completed word found by the db.
    
    let response = await completeWord(cutWord(message.cleanContent));

    // Ignore if there is no completion
    if ((response || response === "") && Math.random() > 0.6) {
      message.reply(response);
    }
  } catch (e) {
    console.log(e);
  }
})

client.login(process.env.TOKEN);
