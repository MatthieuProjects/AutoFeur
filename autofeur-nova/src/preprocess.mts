import { writeFile, writeFileSync } from "fs";
import { request } from "undici";

const phonemize = (grapheme: string) =>
  request(
    `http://localhost:5000?grapheme=${encodeURIComponent(grapheme)}`
  ).then((x) => x.body.text());

let jsonData: {
  word: string;
  phoneme: string;
  partials: Record<string, string>;
}[] = [];

let words: string[] = [
  "ta mere",
  "tapis",
  "taper",
  "tare",
  "tabasser",
  "tabouret",
  "rigole",
  "amène",
  "atchoum",
  "abracadabra",
  "abeille",
  "alibaba",
  "arnaque",
  "maison",
  "nombril",
  "lapin",
  "ouistiti",
  "wifi",
  "uifi",
  "ouisky",
  "uisky",
  "renard",
  "requin",
  "repas",
  "retard",
  "coiffeur",
  "coiffeuse",
  "kirikou",
  "kiri",
  "western",
  "un deux",
  "hein deux",
  "deu trois",
  "yoplait",
  "avalanche",
  "moisissure",
  "moisson",
  "moineau",
  "école",
  "commentaire",
  "quantificateur",
  "commandant",
  "claire chazal",
  "tornade",
  "bottes",
  "bonsoir pariiiss",
  "courtois",
  "facteur",
  "gérard",
  "quoidrilatère",
  "pepe",
  "surfeur",
  "toilettes",
  "lebron james",
  "c'est de la merde"
];

(async () => {
  for (const word of words) {
    let phoneme = await phonemize(word);
    let partials: Record<string, string> = {};

    for (let i = 3; i <= word.length; i++) {
      // add n last characters from the phoneme
      let add = word.slice(word.length - i, word.length);
      partials[add] = await phonemize(add);
    }

    jsonData.push({ phoneme, word, partials });
  }

  writeFileSync("./data.json", JSON.stringify(jsonData));
})();
