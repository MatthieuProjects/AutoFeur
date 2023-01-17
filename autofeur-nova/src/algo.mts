import { readFileSync } from "fs";
import { request } from "undici";

const phonemize = (grapheme: string) =>
  request(
    `http://localhost:5000?grapheme=${encodeURIComponent(grapheme)}`
  ).then((x) => x.body.text());

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
    let maxIter = Math.min(sentenceWord.length, phoneme.length);
    let overlap = 0;
    for (let i = maxIter - 1; i !== 0; i--) {
      let part1 = sentenceWord[sentenceWord.length - i - 1];
      let part2 = phoneme[i];
      if (part1 !== part2) {
        console.log("\t\tnot eq", part1, part2);
        break;
      }
      overlap++;
    }
    console.debug("\ttesting with word = ", overlap, word, phoneme);

    /*
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
        let phonemeIndex = partials.indexOf(add);

        if (phonemeIndex == -1) {
          // cannot find the comlpetion count.
          // default to index
          console.log("couldn't find corresponding cut", add);
          phonemeIndex = word.length + 1;
        }

        let complete = word.slice(word.length - phonemeIndex - 1, word.length);

        console.log("\t\tmatched with score = ", score, " complete = ", complete);

        // need to change to the cut-ed version.
        scores.push({ score, complete: `${complete} (${word})` });
      }
    }*/
  }
  return null;
  let resp = scores.sort((a, b) => b.score - a.score);
  return resp[Math.floor(Math.random() * resp.length)]?.complete;
};


match("quoi");