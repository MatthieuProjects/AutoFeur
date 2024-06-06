use std::collections::HashMap;

use rand::{distributions::WeightedIndex, prelude::Distribution, thread_rng};
use serde::{Deserialize, Serialize};
use unicode_segmentation::UnicodeSegmentation;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TrieNode<'a> {
    is_final: bool,
    #[serde(borrow = "'a")]
    child_nodes: HashMap<&'a str, TrieNode<'a>>,
    child_count: u64,
}

impl<'a> TrieNode<'a> {
    // Create new node
    pub fn new<'b>(is_final: bool) -> TrieNode<'b> {
        TrieNode {
            is_final,
            child_nodes: HashMap::with_capacity(256),
            child_count: 0,
        }
    }

    pub fn new_root<'b>() -> TrieNode<'b> {
        TrieNode {
            is_final: false,
            child_nodes: HashMap::with_capacity(256),
            child_count: 0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Trie<'a> {
    #[serde(borrow = "'a")]
    root_node: Box<TrieNode<'a>>,
}

impl<'a> Trie<'a> {
    // Create a TrieStruct
    pub fn new<'b>() -> Trie<'b> {
        Trie {
            root_node: Box::new(TrieNode::new_root()),
        }
    }

    // Insert a string
    pub fn insert(&mut self, char_list: &'a str) {
        let mut current_node: &mut TrieNode = self.root_node.as_mut();
        let iterator = char_list.graphemes(true);
        let mut create = false;

        current_node.child_count += 1;
        // Find the minimum existing math
        for str in iterator {
            if create == false {
                if current_node.child_nodes.contains_key(str) {
                    current_node = current_node.child_nodes.get_mut(str).unwrap();
                    // we mark the node as containing our children.
                    current_node.child_count += 1;
                } else {
                    create = true;

                    current_node.child_nodes.insert(str, TrieNode::new(false));
                    current_node = current_node.child_nodes.get_mut(str).unwrap();
                    current_node.child_count = 1;
                }
            } else {
                current_node.child_nodes.insert(str, TrieNode::new(false));
                current_node = current_node.child_nodes.get_mut(str).unwrap();
                // we will only have one final node
                current_node.child_count = 1;
            }
        }
        current_node.is_final = true;
    }

    // Find a string
    pub fn random_starting_with(&self, prefix: &str) -> Option<String> {
        let mut current_node: &TrieNode = self.root_node.as_ref();
        // String for the return value
        let mut builder = String::new();

        // Iterator over each grapheme
        let graphemes = prefix.graphemes(true).enumerate();

        // Descend as far as possible into the tree
        for (_, str) in graphemes {
            // If we can descend further into the tree
            if let Some(node) = current_node.child_nodes.get(&str) {
                current_node = node;
                builder += str;
                println!("going into node {}", builder);
            } else {
                // couldn't descend fully into the tree
                // this basically means nothing exist in the tree
                // with this prefix
                println!("no matches for prefix!");
                return None;
            }
        }

        println!("Found common root node {}", builder);
        builder = String::new();
        let mut rng = thread_rng();

        let mut length = 0;
        while current_node.child_nodes.len() != 0 {
            // We need to choose a random child based on weights
            let weighted = WeightedIndex::new(
                current_node
                    .child_nodes
                    .iter()
                    .map(|(_, node)| node.child_count / (length + 1)),
            )
            .expect("distribution creation should be valid");

            let (key, node) = current_node
                .child_nodes
                .iter()
                .nth(weighted.sample(&mut rng))
                .expect("choosed value did not exist");
            println!("waling into node {}", key);

            current_node = node;
            builder += key;

            // If this node is final and has childrens
            if current_node.is_final && current_node.child_count > 0 {
                // choose from current node or continue with childrens
                let weighted = WeightedIndex::new(&[1, current_node.child_count / (length + 1)])
                    .expect("distribution seems impossible");

                if weighted.sample(&mut rng) == 0 {
                    // we choosed this node!
                    // stop adding other characters
                    break;
                }
            }
            length += 1;
        }

        // If we only added
        if builder == "" {
            return None;
        }

        // selected word
        Some(builder)
    }
}
