use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::trie::Trie;

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct Save {
    pub trie: Trie,
    pub reverse_index: HashMap<String, String>
}