use std::collections::HashMap;

use rand::{thread_rng, Rng};
use serde::{Deserialize, Serialize};

use crate::french_ipa::{FrenchIPAChar, FrenchIPAWord};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TrieNode {
    value: Option<FrenchIPAChar>,
    is_final: bool,
    child_nodes: HashMap<FrenchIPAChar, TrieNode>,
    child_count: u64,
}

impl TrieNode {
    // Create new node
    pub fn new(c: FrenchIPAChar, is_final: bool) -> TrieNode {
        TrieNode {
            value: Option::Some(c),
            is_final,
            child_nodes: HashMap::with_capacity(FrenchIPAChar::SIZE),
            child_count: 0,
        }
    }

    pub fn new_root() -> TrieNode {
        TrieNode {
            value: Option::None,
            is_final: false,
            child_nodes: HashMap::with_capacity(FrenchIPAChar::SIZE),
            child_count: 0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Trie {
    root_node: Box<TrieNode>,
}

impl Trie {
    // Create a TrieStruct
    pub fn new() -> Trie {
        Trie {
            root_node: Box::new(TrieNode::new_root()),
        }
    }

    // Insert a string
    pub fn insert(&mut self, char_list: FrenchIPAWord) {
        let mut current_node: &mut TrieNode = self.root_node.as_mut();
        let mut last_match = 0;

        // Find the minimum existing math
        for letter_counter in 0..char_list.len() {
            if current_node
                .child_nodes
                .contains_key(&char_list[letter_counter])
            {
                current_node = current_node
                    .child_nodes
                    .get_mut(&char_list[letter_counter])
                    .unwrap();
                // we mark the node as containing our children.
                current_node.child_count += 1;
            } else {
                last_match = letter_counter;
                break;
            }
            last_match = letter_counter + 1;
        }

        // if we found an already exsting node
        if last_match == char_list.len() {
            current_node.is_final = true;
        } else {
            for new_counter in last_match..char_list.len() {
                let key = char_list[new_counter];
                current_node
                    .child_nodes
                    .insert(key, TrieNode::new(char_list[new_counter], false));
                current_node = current_node.child_nodes.get_mut(&key).unwrap();
                current_node.child_count += 1;
            }
            current_node.is_final = true;
        }
    }

    // Find a string
    pub fn random_starting_with(&self, prefix: FrenchIPAWord) -> Option<String> {
        let mut current_node: &TrieNode = self.root_node.as_ref();
        let mut str = String::new();
        let mut i = prefix.len();
        // Descend as far as possible into the tree
        for counter in prefix {
            if let Some(node) = current_node.child_nodes.get(&counter) {
                current_node = node;
                if let Some(value) = current_node.value {
                    str += value.to_char();
                    i -= 1;
                }
            } else {
                // couldn't descend fully into the tree
                return None;
            }
        }

        println!("Found common root node {}", str);

        // Ignore the 0-len matches
        if i == 0 && current_node.child_nodes.len() == 0 {
            println!("removing 0-len match");
            return None;
        }
        str = String::new();

        // now that we have the node we descend by respecting the probabilities
        while current_node.child_nodes.len() != 0 && current_node.child_count > 0 {
            println!("Descending into node {}", str);
            let max = current_node.child_count;
            let random_number = thread_rng().gen_range(0..max);
            let mut increment = 0;

            let mut did_change = false;
            // find node corresponding to the node
            for (_, node) in &current_node.child_nodes {
                if node.child_count + increment >= random_number {
                    println!("changing node");
                    current_node = node;
                    did_change = true;
                    break;
                } else {
                    println!(
                        "didn't change node: {}<{}",
                        node.child_count + increment,
                        random_number
                    )
                }
                increment += node.child_count;
            }
            if did_change {
                if let Some(value) = current_node.value {
                    println!("added {}", value.to_char());
                    str += value.to_char();
                }
            } else {
                println!(
                    "WARNING: DIDNT CHANGE NODE child_count={}",
                    current_node.child_count
                )
            }
            // if this node is a final node, we have a probability of using it
            if current_node.is_final && current_node.child_count > 0 {
                let random_number = thread_rng().gen_range(0..current_node.child_count);
                if random_number == 0 {
                    break;
                }
            }
        }

        if str == "" {
            return None;
        }

        // selected word
        Some(str)
    }
}
