# Graph Homeomorphism Checker

An interactive web-based tool for visualizing and checking graph homeomorphism and isomorphism. Built with vanilla JavaScript and Cytoscape.js.

🔗 **[Live Demo](https://yourusername.github.io/homeomorphism/)**

## Features

### Interactive Graph Drawing
- **Add Nodes**: Left-click on empty space to add nodes
- **Remove Nodes**: Right-click on nodes to remove them
- **Create Edges**: Click and drag from one node to another to create edges
- **Dual Canvas**: Side-by-side graph panels for easy comparison

### Algorithm Implementation

#### Homeomorphism Detection
Two graphs are **homeomorphic** if one can be transformed into the other by subdividing edges (inserting degree-2 nodes along edges).

**Algorithm approach:**
1. Simplify both graphs by iteratively removing degree-2 nodes
2. Connect neighbors of removed nodes
3. Check if simplified graphs are isomorphic

#### Isomorphism Detection
Two graphs are **isomorphic** if there exists a bijection between vertices that preserves adjacency.

**Algorithm approach:**
1. Quick rejection tests (node count, edge count, degree sequence)
2. Backtracking algorithm to find valid vertex mapping
3. Verify adjacency preservation

### Example Graphs
Load pre-built graph pairs to explore different scenarios:
- **Triangle vs Subdivided Triangle**: Homeomorphic pair demonstrating edge subdivision
- **Star Graphs (4-Star)**: Star graphs with and without subdivisions
- **Path Graphs**: Linear path graphs of different lengths
- **Complete Graph K3**: Complete triangle graph examples
- **Non-Homeomorphic (Tree vs Cycle)**: Example of non-homeomorphic graphs

### Visual Design
- Clean, modern pastel color scheme
- Rounded corners and smooth transitions
- Responsive layout for different screen sizes
- Intuitive hover effects and visual feedback

## Technologies Used

- **Vanilla JavaScript** - No frameworks, pure ES6+
- **HTML5 & CSS3** - Modern web standards
- **Cytoscape.js** - Graph visualization library
- **GitHub Pages** - Static site hosting

## Installation & Usage

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/homeomorphism.git
   cd homeomorphism
   ```

2. Open `index.html` in your browser:
   - Double-click the file, or
   - Use a local server: `python -m http.server 8000`

### Deployment to GitHub Pages
1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Select branch: `main` and folder: `/ (root)`
4. Save and wait for deployment

## How It Works

### Homeomorphism Algorithm

```javascript
// Simplified pseudocode
function checkHomeomorphism(graph1, graph2):
    simplified1 = removeAllDegree2Nodes(graph1)
    simplified2 = removeAllDegree2Nodes(graph2)
    return areIsomorphic(simplified1, simplified2)
```

The key insight: degree-2 nodes represent edge subdivisions. By removing them and connecting their neighbors, we can reduce both graphs to their "core" structure.

### Isomorphism Algorithm

```javascript
// Simplified pseudocode
function checkIsomorphism(graph1, graph2):
    if nodeCount(graph1) ≠ nodeCount(graph2): return false
    if edgeCount(graph1) ≠ edgeCount(graph2): return false
    if degreeSequence(graph1) ≠ degreeSequence(graph2): return false
    return findVertexMapping(graph1, graph2) using backtracking
```

## Project Structure

```
homeomorphism/
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── script.js           # Graph logic and algorithms
└── README.md           # Documentation
```

## Educational Context

### Graph Theory Concepts

**Homeomorphism**: A topological equivalence relation. Two graphs are homeomorphic if they have the same "shape" when ignoring degree-2 nodes.

**Isomorphism**: A structural equivalence. Two graphs are isomorphic if they have identical structure (same connectivity pattern).

**Key Difference**: 
- Isomorphic graphs must have the same number of nodes
- Homeomorphic graphs can have different numbers of nodes (due to subdivisions)
- All isomorphic graphs are homeomorphic, but not vice versa

## Algorithm Complexity

- **Homeomorphism Detection**: O(n² + m) for simplification, then isomorphism check
- **Isomorphism Detection**: O(n!) worst case (NP-complete), but optimized with pruning
- **Practical Performance**: Works efficiently for graphs up to ~30 nodes

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Future Enhancements

Potential improvements:
- [ ] Undo/Redo functionality
- [ ] Export graphs as images or JSON
- [ ] More sophisticated isomorphism algorithms (e.g., Weisfeiler-Lehman)
- [ ] Directed graph support
- [ ] Animation showing the simplification process
- [ ] Step-by-step algorithm visualization

## License

MIT License - feel free to use this project for learning or portfolio purposes.

## Author

Created as a portfolio project demonstrating:
- Algorithm implementation skills
- Graph theory knowledge
- Clean, modern frontend development
- Interactive visualization techniques

---

**Note**: This is an educational project. While the algorithms are correct for small to medium graphs, production graph analysis tools would use more sophisticated approaches for large-scale graphs.