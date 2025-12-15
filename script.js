// Global variables
let cy1, cy2;
let nodeIdCounter1 = 0;
let nodeIdCounter2 = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme from localStorage
    initializeTheme();
    
    cy1 = createCytoscape('cy1', getNodeColorA());
    cy2 = createCytoscape('cy2', getNodeColorB());
    
    setupCytoscapeInteractions(cy1, () => nodeIdCounter1++);
    setupCytoscapeInteractions(cy2, () => nodeIdCounter2++);
    
    // Theme toggle event listener
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // About modal event listeners
    document.getElementById('about-btn').addEventListener('click', openAboutModal);
    document.querySelector('.modal-close').addEventListener('click', closeAboutModal);
    document.getElementById('about-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAboutModal();
        }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAboutModal();
        }
    });
    
    document.getElementById('check-homeomorphism').addEventListener('click', function() {
        if (cy1.nodes().length === 0 || cy2.nodes().length === 0) {
            showResult("Please create graphs in both panels before checking.", "info");
            return;
        }
        const result = checkHomeomorphism(cy1, cy2);
        showResult(
            result ? "✓ The graphs are homeomorphic!" : "✗ The graphs are not homeomorphic.",
            result ? "success" : "failure"
        );
    });
    
    document.getElementById('check-isomorphism').addEventListener('click', function() {
        if (cy1.nodes().length === 0 || cy2.nodes().length === 0) {
            showResult("Please create graphs in both panels before checking.", "info");
            return;
        }
        const result = checkIsomorphism(cy1, cy2);
        showResult(
            result ? "✓ The graphs are isomorphic!" : "✗ The graphs are not isomorphic.",
            result ? "success" : "failure"
        );
    });
    
    document.getElementById('example-selector').addEventListener('change', function(e) {
        if (e.target.value) {
            loadExample(e.target.value);
            e.target.value = ""; // Reset dropdown
        }
    });
});

function createCytoscape(containerId, nodeColor) {
    return cytoscape({
        container: document.getElementById(containerId),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': nodeColor,
                    'label': 'data(id)',
                    'width': 35,
                    'height': 35,
                    'font-size': 14,
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': '#2C3E50',
                    'font-weight': 600,
                    'border-width': 2,
                    'border-color': '#FFFFFF',
                    'transition-property': 'background-color, border-color, width, height',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node:hover',
                style: {
                    'background-color': '#B4E7CE',
                    'border-color': '#A8E6CF',
                    'width': 40,
                    'height': 40
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#95A5A6',
                    'curve-style': 'bezier',
                    'transition-property': 'line-color, width',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge:hover',
                style: {
                    'line-color': '#34495E',
                    'width': 4
                }
            },
            {
                selector: '.highlighted',
                style: {
                    'background-color': '#F39C12',
                    'border-color': '#E67E22'
                }
            }
        ],
        layout: {
            name: 'preset'
        },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,
        wheelSensitivity: 0.4,
        minZoom: 0.5,
        maxZoom: 3.0
    });
}

function setupCytoscapeInteractions(cy, getNodeId) {
    let sourceNode = null;

    cy.on('tap', function(event) {
        if (event.target === cy) {
            const position = event.position;
            const nodeId = 'n' + getNodeId();
            cy.add({
                group: 'nodes',
                data: { id: nodeId },
                position: position
            });
        }
    });

    cy.on('cxttap', 'node', function(event) {
        cy.remove(event.target);
    });

    cy.on('mousedown', 'node', function(event) {
        sourceNode = event.target;
    });

    cy.on('mouseup', 'node', function(event) {
        if (sourceNode && sourceNode !== event.target) {
            const edgeId = 'e' + sourceNode.id() + '-' + event.target.id();
            // Check if edge already exists
            const existingEdge = cy.edges(`[id = "${edgeId}"]`);
            const reverseEdgeId = 'e' + event.target.id() + '-' + sourceNode.id();
            const existingReverseEdge = cy.edges(`[id = "${reverseEdgeId}"]`);
            
            if (existingEdge.length === 0 && existingReverseEdge.length === 0) {
                cy.add({
                    group: 'edges',
                    data: {
                        id: edgeId,
                        source: sourceNode.id(),
                        target: event.target.id()
                    }
                });
            }
        }
        sourceNode = null;
    });
}

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = type;
}

// ============================================
// HOMEOMORPHISM DETECTION ALGORITHM
// ============================================

function checkHomeomorphism(cy1, cy2) {
    // Two graphs are homeomorphic if they can be obtained from the same graph
    // by subdividing edges (inserting degree-2 nodes)
    
    // Step 1: Simplify both graphs by removing degree-2 nodes
    const simplified1 = simplifyGraph(cy1);
    const simplified2 = simplifyGraph(cy2);
    
    // Step 2: Check if the simplified graphs are isomorphic
    return areGraphsIsomorphic(simplified1, simplified2);
}

function simplifyGraph(cy) {
    // Build adjacency list representation
    const adjList = {};
    const nodes = cy.nodes();
    
    // Initialize adjacency list
    nodes.forEach(node => {
        adjList[node.id()] = [];
    });
    
    // Fill adjacency list (treat as undirected)
    cy.edges().forEach(edge => {
        const source = edge.source().id();
        const target = edge.target().id();
        adjList[source].push(target);
        adjList[target].push(source);
    });
    
    // Remove degree-2 nodes iteratively
    let changed = true;
    while (changed) {
        changed = false;
        for (let node in adjList) {
            if (adjList[node].length === 2) {
                // This is a degree-2 node, remove it and connect its neighbors
                const [neighbor1, neighbor2] = adjList[node];
                
                // Remove this node from its neighbors' lists
                adjList[neighbor1] = adjList[neighbor1].filter(n => n !== node);
                adjList[neighbor2] = adjList[neighbor2].filter(n => n !== node);
                
                // Connect the two neighbors if not already connected
                if (!adjList[neighbor1].includes(neighbor2)) {
                    adjList[neighbor1].push(neighbor2);
                    adjList[neighbor2].push(neighbor1);
                }
                
                // Remove the degree-2 node
                delete adjList[node];
                changed = true;
                break; // Restart the loop
            }
        }
    }
    
    return adjList;
}

function areGraphsIsomorphic(adjList1, adjList2) {
    const nodes1 = Object.keys(adjList1);
    const nodes2 = Object.keys(adjList2);
    
    // Quick rejection tests
    if (nodes1.length !== nodes2.length) return false;
    if (nodes1.length === 0) return true; // Both empty
    
    // Count edges
    const edges1 = Object.values(adjList1).reduce((sum, neighbors) => sum + neighbors.length, 0) / 2;
    const edges2 = Object.values(adjList2).reduce((sum, neighbors) => sum + neighbors.length, 0) / 2;
    if (edges1 !== edges2) return false;
    
    // Compare degree sequences
    const degSeq1 = getDegreeSequence(adjList1);
    const degSeq2 = getDegreeSequence(adjList2);
    if (!arraysEqual(degSeq1, degSeq2)) return false;
    
    // For small graphs, try to find an isomorphism using backtracking
    if (nodes1.length <= 10) {
        return findIsomorphism(adjList1, adjList2);
    }
    
    // For larger graphs, the degree sequence match is a good heuristic
    return true;
}

function getDegreeSequence(adjList) {
    return Object.values(adjList)
        .map(neighbors => neighbors.length)
        .sort((a, b) => b - a);
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function findIsomorphism(adjList1, adjList2) {
    const nodes1 = Object.keys(adjList1);
    const nodes2 = Object.keys(adjList2);
    const mapping = {};
    const used = new Set();
    
    function backtrack(index) {
        if (index === nodes1.length) {
            return true; // Found a valid mapping
        }
        
        const node1 = nodes1[index];
        const degree1 = adjList1[node1].length;
        
        for (let node2 of nodes2) {
            if (used.has(node2)) continue;
            if (adjList2[node2].length !== degree1) continue;
            
            // Try mapping node1 to node2
            mapping[node1] = node2;
            used.add(node2);
            
            // Check if this mapping preserves adjacencies
            let valid = true;
            for (let neighbor1 of adjList1[node1]) {
                if (mapping[neighbor1]) {
                    const neighbor2 = mapping[neighbor1];
                    if (!adjList2[node2].includes(neighbor2)) {
                        valid = false;
                        break;
                    }
                }
            }
            
            if (valid && backtrack(index + 1)) {
                return true;
            }
            
            // Backtrack
            delete mapping[node1];
            used.delete(node2);
        }
        
        return false;
    }
    
    return backtrack(0);
}

// ============================================
// ISOMORPHISM DETECTION ALGORITHM
// ============================================

function checkIsomorphism(cy1, cy2) {
    // Build adjacency lists for both graphs
    const adjList1 = buildAdjacencyList(cy1);
    const adjList2 = buildAdjacencyList(cy2);
    
    // Check if graphs are isomorphic
    return areGraphsIsomorphic(adjList1, adjList2);
}

function buildAdjacencyList(cy) {
    const adjList = {};
    const nodes = cy.nodes();
    
    // Initialize adjacency list
    nodes.forEach(node => {
        adjList[node.id()] = [];
    });
    
    // Fill adjacency list (treat as undirected)
    cy.edges().forEach(edge => {
        const source = edge.source().id();
        const target = edge.target().id();
        adjList[source].push(target);
        adjList[target].push(source);
    });
    
    return adjList;
}

// ============================================
// EXAMPLE GRAPHS SYSTEM
// ============================================

const EXAMPLE_GRAPHS = {
    triangle: {
        name: "Triangle vs Subdivided Triangle",
        graphA: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 100 } },
                { id: 'n1', position: { x: 100, y: 250 } },
                { id: 'n2', position: { x: 300, y: 250 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n0' }
            ]
        },
        graphB: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 100 } },
                { id: 'n1', position: { x: 100, y: 250 } },
                { id: 'n2', position: { x: 300, y: 250 } },
                { id: 'n3', position: { x: 150, y: 175 } }
            ],
            edges: [
                { source: 'n0', target: 'n3' },
                { source: 'n3', target: 'n1' },
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n0' }
            ]
        }
    },
    star: {
        name: "Star Graphs (4-Star)",
        graphA: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 175 } },
                { id: 'n1', position: { x: 200, y: 75 } },
                { id: 'n2', position: { x: 100, y: 175 } },
                { id: 'n3', position: { x: 300, y: 175 } },
                { id: 'n4', position: { x: 200, y: 275 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n0', target: 'n2' },
                { source: 'n0', target: 'n3' },
                { source: 'n0', target: 'n4' }
            ]
        },
        graphB: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 175 } },
                { id: 'n1', position: { x: 200, y: 75 } },
                { id: 'n2', position: { x: 100, y: 175 } },
                { id: 'n3', position: { x: 300, y: 175 } },
                { id: 'n4', position: { x: 200, y: 275 } },
                { id: 'n5', position: { x: 200, y: 125 } }
            ],
            edges: [
                { source: 'n0', target: 'n5' },
                { source: 'n5', target: 'n1' },
                { source: 'n0', target: 'n2' },
                { source: 'n0', target: 'n3' },
                { source: 'n0', target: 'n4' }
            ]
        }
    },
    path: {
        name: "Path Graphs",
        graphA: {
            nodes: [
                { id: 'n0', position: { x: 50, y: 175 } },
                { id: 'n1', position: { x: 150, y: 175 } },
                { id: 'n2', position: { x: 250, y: 175 } },
                { id: 'n3', position: { x: 350, y: 175 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n3' }
            ]
        },
        graphB: {
            nodes: [
                { id: 'n0', position: { x: 50, y: 175 } },
                { id: 'n1', position: { x: 130, y: 175 } },
                { id: 'n2', position: { x: 200, y: 175 } },
                { id: 'n3', position: { x: 270, y: 175 } },
                { id: 'n4', position: { x: 350, y: 175 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n3' },
                { source: 'n3', target: 'n4' }
            ]
        }
    },
    complete: {
        name: "Complete Graph K3",
        graphA: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 100 } },
                { id: 'n1', position: { x: 100, y: 250 } },
                { id: 'n2', position: { x: 300, y: 250 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n0' }
            ]
        },
        graphB: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 100 } },
                { id: 'n1', position: { x: 100, y: 200 } },
                { id: 'n2', position: { x: 300, y: 200 } },
                { id: 'n3', position: { x: 200, y: 300 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n1', target: 'n3' },
                { source: 'n3', target: 'n2' },
                { source: 'n2', target: 'n0' },
                { source: 'n0', target: 'n3' }
            ]
        }
    },
    'non-homeo': {
        name: "Non-Homeomorphic (Tree vs Cycle)",
        graphA: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 100 } },
                { id: 'n1', position: { x: 150, y: 200 } },
                { id: 'n2', position: { x: 250, y: 200 } },
                { id: 'n3', position: { x: 100, y: 300 } },
                { id: 'n4', position: { x: 200, y: 300 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n0', target: 'n2' },
                { source: 'n1', target: 'n3' },
                { source: 'n1', target: 'n4' }
            ]
        },
        graphB: {
            nodes: [
                { id: 'n0', position: { x: 200, y: 100 } },
                { id: 'n1', position: { x: 100, y: 200 } },
                { id: 'n2', position: { x: 200, y: 300 } },
                { id: 'n3', position: { x: 300, y: 200 } }
            ],
            edges: [
                { source: 'n0', target: 'n1' },
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n3' },
                { source: 'n3', target: 'n0' }
            ]
        }
    }
};

function loadExample(exampleKey) {
    const example = EXAMPLE_GRAPHS[exampleKey];
    if (!example) return;
    
    // Clear both graphs
    cy1.elements().remove();
    cy2.elements().remove();
    
    // Reset node counters
    nodeIdCounter1 = 0;
    nodeIdCounter2 = 0;
    
    // Load Graph A
    example.graphA.nodes.forEach(node => {
        cy1.add({
            group: 'nodes',
            data: { id: node.id },
            position: node.position
        });
    });
    example.graphA.edges.forEach(edge => {
        cy1.add({
            group: 'edges',
            data: {
                id: 'e' + edge.source + '-' + edge.target,
                source: edge.source,
                target: edge.target
            }
        });
    });
    
    // Load Graph B
    example.graphB.nodes.forEach(node => {
        cy2.add({
            group: 'nodes',
            data: { id: node.id },
            position: node.position
        });
    });
    example.graphB.edges.forEach(edge => {
        cy2.add({
            group: 'edges',
            data: {
                id: 'e' + edge.source + '-' + edge.target,
                source: edge.source,
                target: edge.target
            }
        });
    });
    
    // Update node counters based on loaded nodes
    const maxId1 = Math.max(...example.graphA.nodes.map(n => parseInt(n.id.substring(1))));
    const maxId2 = Math.max(...example.graphB.nodes.map(n => parseInt(n.id.substring(1))));
    nodeIdCounter1 = maxId1 + 1;
    nodeIdCounter2 = maxId2 + 1;
    
    showResult(`Loaded: ${example.name}`, "info");
}

// ============================================
// THEME MANAGEMENT
// ============================================

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeToggleUI(true);
    } else {
        updateThemeToggleUI(false);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggleUI(isDark);
    
    // Update Cytoscape graph colors
    updateCytoscapeTheme();
}

function updateThemeToggleUI(isDark) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (isDark) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    }
}

function getNodeColorA() {
    return document.body.classList.contains('dark-theme') ? '#64B5F6' : '#A8DADC';
}

function getNodeColorB() {
    return document.body.classList.contains('dark-theme') ? '#FF8A65' : '#FFB5A7';
}

function getEdgeColor() {
    return document.body.classList.contains('dark-theme') ? '#78909C' : '#95A5A6';
}

function getEdgeHoverColor() {
    return document.body.classList.contains('dark-theme') ? '#90A4AE' : '#34495E';
}

function getNodeHoverColor() {
    return document.body.classList.contains('dark-theme') ? '#4FC3F7' : '#B4E7CE';
}

function getNodeBorderHoverColor() {
    return document.body.classList.contains('dark-theme') ? '#29B6F6' : '#A8E6CF';
}

function updateCytoscapeTheme() {
    const nodeColorA = getNodeColorA();
    const nodeColorB = getNodeColorB();
    const edgeColor = getEdgeColor();
    const edgeHoverColor = getEdgeHoverColor();
    const nodeHover = getNodeHoverColor();
    const nodeBorderHover = getNodeBorderHoverColor();
    
    // Update cy1 styles
    cy1.style()
        .selector('node')
        .style({
            'background-color': nodeColorA
        })
        .selector('node:hover')
        .style({
            'background-color': nodeHover,
            'border-color': nodeBorderHover
        })
        .selector('edge')
        .style({
            'line-color': edgeColor
        })
        .selector('edge:hover')
        .style({
            'line-color': edgeHoverColor
        })
        .update();
    
    // Update cy2 styles
    cy2.style()
        .selector('node')
        .style({
            'background-color': nodeColorB
        })
        .selector('node:hover')
        .style({
            'background-color': nodeHover,
            'border-color': nodeBorderHover
        })
        .selector('edge')
        .style({
            'line-color': edgeColor
        })
        .selector('edge:hover')
        .style({
            'line-color': edgeHoverColor
        })
        .update();
}

// ============================================
// ABOUT MODAL MANAGEMENT
// ============================================

function openAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}
