use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::trie::Trie;

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct Save<'a> {
    #[serde(borrow = "'a")]
    pub trie: Trie<'a>,
    pub reverse_index: HashMap<String, String>,
}
