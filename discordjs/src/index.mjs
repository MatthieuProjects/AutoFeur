// Require the necessary discord.js classes
import { Client, GatewayIntentBits } from 'discord.js';
import { request } from "undici";

// Create a new client instance
const client = new Client({ intents:
  [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

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
  "1248226018406301696",
  "995243987948544090"
]

const ignoredEveryoneChannels = [
  "1055130476395909210"
]

let messageReplyCounter = 0;
const messageAction = async (message, ctx) => {
  if (message.author.bot) return;

  messageReplyCounter += 1;
  console.log("counter is at", messageReplyCounter);

  let currentTimestamp = Date.now();
  let lastMessageTimestamp = await message
    .channel
    .messages
    .fetch({
      limit: 2,
      cache : false
    })
    .last()
    .createdTimestamp;
  
  let shouldReplyByTimestamp = currentTimestamp - lastMessageTimestamp >= 3600;
  let shouldReplyByCounter =
    messageReplyCounter >= Math.floor(Math.random() * 75) + 35;
  let shouldReply = (
    (ctx === Symbol.for("created") && shouldReplyByTimestamp) ||
    shouldReplyByCounter ||
    specialChannels.includes(message.channelId) ||
    message.guild == null
  );

  if (shouldReply) {
    let oldCounter = messageReplyCounter;
    if (shouldReplyByTimestamp || shouldReplyByCounter) {
      messageReplyCounter = 0;
    }
    const cleanText = sanitizeWord(message.cleanContent);
    if (countChars(cleanText) > 0) {
      let response = await completeWord(cleanText);

      // Ignore if there is no completion
      if ((response || response === "")) {
        message.reply(response);
      }
    } else if (shouldReplyByCounter) {
      messageReplyCounter = oldCounter;
    }
  }
  
  if (message.content.includes("@everyone") && !ignoredEveryoneChannels.includes(message.channelId)) {
    message.reply("https://cdn.mpgn.dev/pascontent-gabe.gif");
  }
  if (message.content.includes("<:quoi:1061204752542748742>")) {
    message.reply("<:quoi:1061204752542748742>")
  }
};
client.on("messageCreate", message => messageAction(message, Symbol.for("created")));
client.on("messageUpdate", (_, message) => messageAction(message, Symbol.for("updated")));

client.login(process.env.TOKEN);
