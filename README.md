# Graph Homeomorphism Checker

Interactive tool for checking graph homeomorphism and isomorphism. Draw graphs and see if they're equivalent.

🔗 **[Live Demo](https://yourusername.github.io/homeomorphism/)**

## Features

- **Draw graphs**: click to add nodes, drag between nodes for edges, right-click to delete
- **Check homeomorphism**: see if two graphs have the same topological structure
- **Check isomorphism**: see if two graphs are structurally identical  
- **Example graphs**: load pre-built examples to explore different scenarios
- **Dark mode**: toggle between light and dark themes
- **Undo/Redo**: keyboard shortcuts (Ctrl+Z, Ctrl+Y) for graph edits
- **Export**: save graphs as JSON or export as PNG image

## What's Homeomorphism?

Two graphs are homeomorphic if one can be transformed into the other by adding or removing degree-2 nodes (nodes with exactly 2 connections). It's about topological equivalence - same "shape" even if they look different.

Isomorphism is stricter - graphs must have identical structure with same number of nodes and edges.

## Tech Stack

Built with vanilla JavaScript and Cytoscape.js for graph rendering.

## How It Works

The homeomorphism algorithm removes all degree-2 nodes from both graphs, then checks if the simplified versions are isomorphic. The isomorphism checker uses backtracking with degree sequence optimization.

## License

MIT - use it for whatever you want.
