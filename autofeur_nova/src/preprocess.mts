import { writeFileSync } from "fs";
import { request } from "undici";
import { phonemize } from "./phonemizelib.mjs";

let jsonData: {
  word: string;
  phoneme: string;
  partials: Record<string, string>;
}[] = [];

let words: string[] = [
  "ta mère",
  "tapis",
  "taper",
  "taré",
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
  "wisky",
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
  "deux trois",
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
  "c'est de la merde",
  "trois quatre",
  "quatre cinq",
  "cinq six",
  "six sept",
];

(async () => {
  for (const word of words) {
    let phoneme = await phonemize(word);
    let partials: Record<string, string> = {};

    for (let i = 3; i <= word.length; i++) {
      // add n last characters from the phoneme
      let add = word.slice(word.length - i, word.length);
      partials[await phonemize(add)] = add;
    }

    jsonData.push({ phoneme, word, partials });
  }

  writeFileSync("./data.json", JSON.stringify(jsonData));
})();
