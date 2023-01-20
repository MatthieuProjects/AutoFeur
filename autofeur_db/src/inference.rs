use std::{collections::VecDeque, env, ops::Add};

use anyhow::anyhow;
use itertools::Itertools;
use levenshtein::levenshtein;
use unicode_segmentation::UnicodeSegmentation;

use crate::{french_ipa::parse_word, save::Save};

async fn call_inference_service(word: &str) -> anyhow::Result<String> {
    let server: Result<String, anyhow::Error> =
        env::var("PHONEMIZER").or_else(|_| Ok("".to_string()));
    Ok(
        reqwest::get(format!("{}?grapheme={}", server.unwrap(), word))
            .await?
            .text()
            .await?,
    )
}

impl Save {
    pub async fn inference(&self, prefix: &str) -> anyhow::Result<String> {
        let phonemes = call_inference_service(prefix).await?;
        let ipa_phonemes =
            parse_word(&phonemes).ok_or_else(|| anyhow!("failed to parse the word"))?;

        let completion = self
            .trie
            .random_starting_with(ipa_phonemes)
            .ok_or_else(|| anyhow!("no matches"))?;

        let infered = phonemes.add(&completion);
        let word = self
            .reverse_index
            .get(&infered)
            .ok_or_else(|| anyhow!("matched values is not in dictionary"))?;

        println!("Matching {} by adding {}", word, completion);

        // we finally just need to compute the end of the word which matches the sound
        let mut found = None;

        let mut characters: VecDeque<&str> = word.graphemes(true).collect();
        while let Some(_) = characters.pop_front() {
            let sub: String = characters.iter().join("");
            let inference = call_inference_service(&sub).await?;

            if levenshtein(&inference, &completion) < 2 {
                found = Some(sub);
                break;
            } else {
                println!("did not match a={}, b={}", inference, completion)
            }
        }

        let found = found.ok_or_else(|| anyhow!("no prefix could be matched"))?;
        println!("{} is equivalent to {}", completion, found);

        Ok(format!("{} ({})", found, word))
    }
}
