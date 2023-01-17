import { readFileSync } from "fs";
import { request } from "undici";
import { phonemize } from "./phonemizelib.mjs";

let data: {
  word: string;
  phoneme: string;
  partials: string[];
}[] = JSON.parse(readFileSync("./data.json").toString("utf8"));

const cutWord = (sentence: string) => {
  let lastWord = sentence.split(" ").slice(-1)[0].replace(/(\?)/g, "");
  return phonemize(lastWord);
};

export const match = async (sentence: string) => {
  let scores: { complete: string; score: number }[] = [];
  let sentenceWord = await cutWord(sentence);
  console.debug("handling word phoneme = ", sentenceWord);

  for (const { phoneme, word, partials } of data) {
    console.debug("\ttesting with word = ", word, phoneme);

    
    for (let i = 1; i < phoneme.length; i++) {
      // add n last characters from the phoneme
      let add = phoneme.slice(phoneme.length - i, phoneme.length);
      console.debug(
        "\t\ttesting match with = ",
        add,
        " add = ",
        sentenceWord + add
      );

      // we matched a phoneme
      if (phoneme == sentenceWord + add) {
        let score = 1 / (i / phoneme.length);

        // next, we need to find the completion of the word
        // this is relatively easy since we only need to 
        let complete = partials[add];

        if (!complete) {
          // cannot find the comlpetion count.
          // default to index
          console.log("couldn't find corresponding cut", add);
          complete = word;
          continue;
        }

        console.log("\t\tmatched with score = ", score, " complete = ", complete);

        // need to change to the cut-ed version.
        scores.push({ score, complete });
        break;
      }
    }
  }

  let resp = scores.sort((a, b) => b.score - a.score);
  return resp[0]?.complete;
};


match("quoi");