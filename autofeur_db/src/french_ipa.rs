use std::hash::Hash;

use unicode_segmentation::UnicodeSegmentation;

macro_rules! ipa_element_to_number {
    (@step $_idx:expr, $ident:ident,) => {
        None
    };

    (@step $idx:expr, $ident:ident, $head:literal, $($tail:literal,)*) => {
        if $ident == $head {
            Some(Self($idx))
        }
        else {
            ipa_element_to_number!(@step $idx + 1usize, $ident, $($tail,)*)
        }
    };
}
macro_rules! ipa_number_to_ipa {
    (@step $_idx:expr, $ident:ident,) => {
        "unreachable!()"
    };

    (@step $idx:expr, $ident:ident, $head:literal, $($tail:literal,)*) => {
        if $ident == $idx {
            $head
        }
        else {
            ipa_number_to_ipa!(@step $idx + 1usize, $ident, $($tail,)*)
        }
    };
}

macro_rules! replace_expr {
    ($_t:tt $sub:expr) => {
        $sub
    };
}

macro_rules! count_tts {
    ($($tts:tt)*) => {0usize $(+ replace_expr!($tts 1usize))*};
}

macro_rules! ipa_map {
    ($name:ident, $($l:literal),*) => {
        use serde::{Deserialize, Serialize};
        #[derive(Eq, Hash, PartialEq, Debug, Copy, Clone, Serialize, Deserialize)]
        pub struct $name(pub usize);

        impl $name {
            pub const SIZE: usize = count_tts!($($l,)*);

            pub fn from_char(ch: &str) -> Option<$name> {
                ipa_element_to_number!(@step 0usize, ch, $($l,)*)
            }
            pub fn to_char(self) -> &'static str {
                let num = self.0;
                ipa_number_to_ipa!(@step 0usize, num, $($l,)*)
            }
        }
    };
}

ipa_map!(
    FrenchIPAChar,
    "a",
    "ɑ",
    "ɑ̃",
    "e",
    "ɛ",
    "ɛ̃",
    "ə",
    "i",
    "o",
    "ɔ",
    "ɔ̃",
    "œ",
    "œ̃",
    "ø",
    "u",
    "y",
    "j",
    "ɥ",
    "w",
    "b",
    "d",
    "f",
    "g",
    "k",
    "l",
    "m",
    "n",
    "ɲ",
    "ŋ",
    "p",
    "ʁ",
    "s",
    "ʃ",
    "t",
    "v",
    "z",
    "ʒ",
    "g",
    "ɡ",
    "ɪ",
    "ʊ",
    "x",
    "r"
);

pub type FrenchIPAWord = Vec<FrenchIPAChar>;

pub fn parse_word(str: &str) -> Option<FrenchIPAWord> {
    let mut word = FrenchIPAWord::default();
    let graphemes: Vec<&str> = str.graphemes(true).collect();
    for (_, grapheme) in graphemes.iter().enumerate() {
        let a = FrenchIPAChar::from_char(grapheme);

        word.push(match a {
            None => {
                println!("invalid char: {}", grapheme);
                return None;
            }
            Some(a) => a,
        })
    }

    Some(word)
}
