use std::fs;

use autofeur::save::Save;
use kdam::tqdm;

#[tokio::main]
/// Generates the DB file foe easy usage.
async fn main() {
    let mut save = Save::default();

    // Read from the
    let mut vocabulary = csv::Reader::from_path("./assets/dictionary.csv").unwrap();
    let mut phonems = vec![];

    // Reduce all the records into the save index
    // this is used to get all the phonemes represented in the csv
    for record in tqdm!(
        vocabulary.records(),
        total = 245178,
        colour = "gradient(#5A56E0,#EE6FF8)"
    ) {
        let record = record.unwrap();
        let word = record.get(0).unwrap().to_string();
        let mut pron: Vec<String> = record
            .get(1)
            .unwrap()
            .split(',')
            .map(|a| {
                a.to_string()
                    .trim()
                    .replace("/", "")
                    .replace("ʼ", "")
                    .replace("ː", "")
                    .replace(" ", "")
                    .replace(".", "")
            })
            .collect();
        for a in &pron {
            save.reverse_index.insert(a.clone(), word.clone());
        }
        phonems.append(&mut pron);
    }

    for phoneme in tqdm!(phonems.iter()) {
        save.trie.insert(&phoneme);
    }

    fs::write("assets/db.bin", bincode::serialize(&save).unwrap()).unwrap();

    println!("Generated to assets/db.bin");
}
