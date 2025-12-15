// globals
let cy1, cy2;
let nodeIdCounter1 = 0;
let nodeIdCounter2 = 0;
let history1 = [];
let history2 = [];
let historyIndex1 = -1;
let historyIndex2 = -1;
let selectedSourceNode = null;
let selectedSourceGraph = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    
    cy1 = createCytoscape('cy1', getNodeColorA());
    cy2 = createCytoscape('cy2', getNodeColorB());
    
    setupCytoscapeInteractions(cy1, () => nodeIdCounter1++);
    setupCytoscapeInteractions(cy2, () => nodeIdCounter2++);
    
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // undo/redo
    document.getElementById('undo-btn').addEventListener('click', () => undo(1));
    document.getElementById('redo-btn').addEventListener('click', () => redo(1));
    document.getElementById('undo-btn2').addEventListener('click', () => undo(2));
    document.getElementById('redo-btn2').addEventListener('click', () => redo(2));
    
    // keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo(1);
        } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo(1);
        }
    });
    
    // export buttons
    document.getElementById('export-json-a').addEventListener('click', () => exportGraphJSON(cy1, 'graph-a'));
    document.getElementById('export-json-b').addEventListener('click', () => exportGraphJSON(cy2, 'graph-b'));
    document.getElementById('export-image').addEventListener('click', exportGraphsImage);
    document.getElementById('about-btn').addEventListener('click', openAboutModal);
    document.querySelector('.modal-close').addEventListener('click', closeAboutModal);
    document.getElementById('about-modal').addEventListener('click', function(e) {
        if (e.target === this) closeAboutModal();
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
    const graphNum = cy.container().id === 'cy1' ? 1 : 2;

    // tap empty space to add node or clear selection
    cy.on('tap', function(event) {
        if (event.target === cy) {
            // clear selection
            clearSelection();
            
            // add node
            const position = event.position;
            const nodeId = 'n' + getNextNodeId(cy);
            const node = cy.add({
                group: 'nodes',
                data: { id: nodeId },
                position: position
            });
            saveHistory(graphNum, 'add-node', { id: nodeId, position: position });
        }
    });

    // tap node for selection/edge creation
    cy.on('tap', 'node', function(event) {
        const clickedNode = event.target;
        
        if (selectedSourceNode === null) {
            // no source selected - select this node
            selectedSourceNode = clickedNode;
            selectedSourceGraph = graphNum;
            clickedNode.addClass('selected-source');
        } else if (selectedSourceNode === clickedNode) {
            // clicked same node - deselect
            clearSelection();
        } else if (selectedSourceGraph !== graphNum) {
            // different graph - clear selection
            clearSelection();
        } else {
            // create edge from source to target
            const sourceId = selectedSourceNode.id();
            const targetId = clickedNode.id();
            const edgeId = 'e' + sourceId + '-' + targetId;
            const reverseEdgeId = 'e' + targetId + '-' + sourceId;
            
            const existingEdge = cy.edges(`[id = "${edgeId}"]`);
            const existingReverseEdge = cy.edges(`[id = "${reverseEdgeId}"]`);
            
            if (existingEdge.length === 0 && existingReverseEdge.length === 0) {
                cy.add({
                    group: 'edges',
                    data: {
                        id: edgeId,
                        source: sourceId,
                        target: targetId
                    }
                });
                saveHistory(graphNum, 'add-edge', {
                    id: edgeId,
                    source: sourceId,
                    target: targetId
                });
            }
            
            clearSelection();
        }
    });

    // right-click to remove node
    cy.on('cxttap', 'node', function(event) {
        const node = event.target;
        
        // clear selection if deleting selected node
        if (selectedSourceNode && selectedSourceNode.id() === node.id()) {
            clearSelection();
        }
        
        const nodeData = {
            id: node.id(),
            position: node.position(),
            edges: []
        };
        
        // save connected edges
        node.connectedEdges().forEach(edge => {
            nodeData.edges.push({
                id: edge.id(),
                source: edge.source().id(),
                target: edge.target().id()
            });
        });
        
        saveHistory(graphNum, 'remove-node', nodeData);
        cy.remove(event.target);
        
        // renumber nodes
        renumberNodes(cy, graphNum);
    });
}

function clearSelection() {
    if (selectedSourceNode) {
        selectedSourceNode.removeClass('selected-source');
        selectedSourceNode = null;
        selectedSourceGraph = null;
    }
}

function getNextNodeId(cy) {
    const nodes = cy.nodes();
    if (nodes.length === 0) return 0;
    
    const usedIds = new Set();
    nodes.forEach(node => {
        const idNum = parseInt(node.id().substring(1));
        usedIds.add(idNum);
    });
    
    // find smallest available id
    let nextId = 0;
    while (usedIds.has(nextId)) {
        nextId++;
    }
    
    return nextId;
}

function renumberNodes(cy, graphNum) {
    const nodes = cy.nodes();
    if (nodes.length === 0) return;
    
    // collect nodes with numeric ids
    const nodeData = [];
    nodes.forEach(node => {
        const idNum = parseInt(node.id().substring(1));
        nodeData.push({
            node: node,
            oldId: node.id(),
            numericId: idNum,
            position: node.position()
        });
    });
    
    // sort by numeric id
    nodeData.sort((a, b) => a.numericId - b.numericId);
    
    // create mapping for renumbering
    const idMapping = {};
    nodeData.forEach((data, index) => {
        const newId = 'n' + index;
        idMapping[data.oldId] = newId;
    });
    
    // collect edge data
    const edgeData = [];
    cy.edges().forEach(edge => {
        edgeData.push({
            source: edge.source().id(),
            target: edge.target().id()
        });
    });
    
    // remove all elements
    cy.elements().remove();
    
    // re-add nodes with new ids
    nodeData.forEach((data, index) => {
        cy.add({
            group: 'nodes',
            data: { id: 'n' + index },
            position: data.position
        });
    });
    
    // re-add edges with updated references
    edgeData.forEach(edge => {
        const newSource = idMapping[edge.source];
        const newTarget = idMapping[edge.target];
        cy.add({
            group: 'edges',
            data: {
                id: 'e' + newSource + '-' + newTarget,
                source: newSource,
                target: newTarget
            }
        });
    });
    
    // update counter
    if (graphNum === 1) {
        nodeIdCounter1 = nodes.length;
    } else {
        nodeIdCounter2 = nodes.length;
    }
}

function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = message;
    resultDiv.className = type;
}

// homeomorphism check
function checkHomeomorphism(cy1, cy2) {
    // remove degree-2 nodes then check if isomorphic
    const simplified1 = simplifyGraph(cy1);
    const simplified2 = simplifyGraph(cy2);
    return areGraphsIsomorphic(simplified1, simplified2);
}

function simplifyGraph(cy) {
    const adjList = {};
    const nodes = cy.nodes();
    
    nodes.forEach(node => {
        adjList[node.id()] = [];
    });
    
    cy.edges().forEach(edge => {
        const source = edge.source().id();
        const target = edge.target().id();
        adjList[source].push(target);
        adjList[target].push(source);
    });
    
    // remove degree-2 nodes
    let changed = true;
    while (changed) {
        changed = false;
        for (let node in adjList) {
            if (adjList[node].length === 2) {
                const [neighbor1, neighbor2] = adjList[node];
                
                adjList[neighbor1] = adjList[neighbor1].filter(n => n !== node);
                adjList[neighbor2] = adjList[neighbor2].filter(n => n !== node);
                
                if (!adjList[neighbor1].includes(neighbor2)) {
                    adjList[neighbor1].push(neighbor2);
                    adjList[neighbor2].push(neighbor1);
                }
                
                delete adjList[node];
                changed = true;
                break;
            }
        }
    }
    
    return adjList;
}

function areGraphsIsomorphic(adjList1, adjList2) {
    const nodes1 = Object.keys(adjList1);
    const nodes2 = Object.keys(adjList2);
    
    if (nodes1.length !== nodes2.length) return false;
    if (nodes1.length === 0) return true;
    
    const edges1 = Object.values(adjList1).reduce((sum, neighbors) => sum + neighbors.length, 0) / 2;
    const edges2 = Object.values(adjList2).reduce((sum, neighbors) => sum + neighbors.length, 0) / 2;
    if (edges1 !== edges2) return false;
    
    const degSeq1 = getDegreeSequence(adjList1);
    const degSeq2 = getDegreeSequence(adjList2);
    if (!arraysEqual(degSeq1, degSeq2)) return false;
    
    if (nodes1.length <= 10) {
        return findIsomorphism(adjList1, adjList2);
    }
    
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
        if (index === nodes1.length) return true;
        
        const node1 = nodes1[index];
        const degree1 = adjList1[node1].length;
        
        for (let node2 of nodes2) {
            if (used.has(node2)) continue;
            if (adjList2[node2].length !== degree1) continue;
            
            mapping[node1] = node2;
            used.add(node2);
            
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
            
            if (valid && backtrack(index + 1)) return true;
            
            delete mapping[node1];
            used.delete(node2);
        }
        
        return false;
    }
    
    return backtrack(0);
}

// isomorphism check
function checkIsomorphism(cy1, cy2) {
    const adjList1 = buildAdjacencyList(cy1);
    const adjList2 = buildAdjacencyList(cy2);
    return areGraphsIsomorphic(adjList1, adjList2);
}

function buildAdjacencyList(cy) {
    const adjList = {};
    const nodes = cy.nodes();
    
    nodes.forEach(node => {
        adjList[node.id()] = [];
    });
    
    cy.edges().forEach(edge => {
        const source = edge.source().id();
        const target = edge.target().id();
        adjList[source].push(target);
        adjList[target].push(source);
    });
    
    return adjList;
}

// examples

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
    
    // complete reset
    clearSelection();
    
    cy1.elements().remove();
    cy2.elements().remove();
    
    nodeIdCounter1 = 0;
    nodeIdCounter2 = 0;
    
    // clear history
    history1 = [];
    history2 = [];
    historyIndex1 = -1;
    historyIndex2 = -1;
    updateUndoRedoButtons();
    
    // load graph a
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
    
    // load graph b
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
    
    const maxId1 = Math.max(...example.graphA.nodes.map(n => parseInt(n.id.substring(1))));
    const maxId2 = Math.max(...example.graphB.nodes.map(n => parseInt(n.id.substring(1))));
    nodeIdCounter1 = maxId1 + 1;
    nodeIdCounter2 = maxId2 + 1;
    
    showResult(`Loaded: ${example.name}`, "info");
}

// undo/redo
function saveHistory(graphNum, action, data) {
    const history = graphNum === 1 ? history1 : history2;
    const index = graphNum === 1 ? historyIndex1 : historyIndex2;
    
    // remove future history if we're not at the end
    history.splice(index + 1);
    
    history.push({ action, data });
    
    if (graphNum === 1) {
        historyIndex1 = history1.length - 1;
    } else {
        historyIndex2 = history2.length - 1;
    }
    
    // limit history size
    if (history.length > 50) {
        history.shift();
        if (graphNum === 1) historyIndex1--;
        else historyIndex2--;
    }
    
    updateUndoRedoButtons();
}

function undo(graphNum) {
    const cy = graphNum === 1 ? cy1 : cy2;
    const history = graphNum === 1 ? history1 : history2;
    let index = graphNum === 1 ? historyIndex1 : historyIndex2;
    
    if (index < 0) return;
    
    const entry = history[index];
    
    if (entry.action === 'add-node') {
        cy.remove(`#${entry.data.id}`);
    } else if (entry.action === 'remove-node') {
        cy.add({
            group: 'nodes',
            data: { id: entry.data.id },
            position: entry.data.position
        });
        entry.data.edges.forEach(edge => {
            cy.add({
                group: 'edges',
                data: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target
                }
            });
        });
    } else if (entry.action === 'add-edge') {
        cy.remove(`#${entry.data.id}`);
    }
    
    if (graphNum === 1) historyIndex1--;
    else historyIndex2--;
    
    updateUndoRedoButtons();
}

function redo(graphNum) {
    const cy = graphNum === 1 ? cy1 : cy2;
    const history = graphNum === 1 ? history1 : history2;
    let index = graphNum === 1 ? historyIndex1 : historyIndex2;
    
    if (index >= history.length - 1) return;
    
    const entry = history[index + 1];
    
    if (entry.action === 'add-node') {
        cy.add({
            group: 'nodes',
            data: { id: entry.data.id },
            position: entry.data.position
        });
    } else if (entry.action === 'remove-node') {
        cy.remove(`#${entry.data.id}`);
    } else if (entry.action === 'add-edge') {
        cy.add({
            group: 'edges',
            data: {
                id: entry.data.id,
                source: entry.data.source,
                target: entry.data.target
            }
        });
    }
    
    if (graphNum === 1) historyIndex1++;
    else historyIndex2++;
    
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const undoBtn2 = document.getElementById('undo-btn2');
    const redoBtn2 = document.getElementById('redo-btn2');
    
    if (undoBtn) undoBtn.disabled = historyIndex1 < 0;
    if (redoBtn) redoBtn.disabled = historyIndex1 >= history1.length - 1;
    if (undoBtn2) undoBtn2.disabled = historyIndex2 < 0;
    if (redoBtn2) redoBtn2.disabled = historyIndex2 >= history2.length - 1;
}

// export
function exportGraphJSON(cy, filename) {
    const data = {
        nodes: [],
        edges: []
    };
    
    cy.nodes().forEach(node => {
        data.nodes.push({
            id: node.id(),
            position: node.position()
        });
    });
    
    cy.edges().forEach(edge => {
        data.edges.push({
            source: edge.source().id(),
            target: edge.target().id()
        });
    });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportGraphsImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // get cytoscape canvases
    const cy1Canvas = cy1.container().querySelector('canvas');
    const cy2Canvas = cy2.container().querySelector('canvas');
    
    canvas.width = cy1Canvas.width + cy2Canvas.width + 40;
    canvas.height = Math.max(cy1Canvas.height, cy2Canvas.height) + 100;
    
    // background
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#1A1A2E' : '#F5F5F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // title
    ctx.fillStyle = document.body.classList.contains('dark-theme') ? '#E4E4E7' : '#2C3E50';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Graph Homeomorphism Checker', canvas.width / 2, 40);
    
    // labels
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#457B9D';
    ctx.fillText('Graph A', cy1Canvas.width / 2 + 20, 70);
    ctx.fillStyle = '#E76F51';
    ctx.fillText('Graph B', cy1Canvas.width + cy2Canvas.width / 2 + 40, 70);
    
    // graphs
    ctx.drawImage(cy1Canvas, 20, 80);
    ctx.drawImage(cy2Canvas, cy1Canvas.width + 40, 80);
    
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graphs-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// theme

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
    
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    themeText.textContent = isDark ? 'Light' : 'Dark';
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
    
    // update styles
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
    
    // cy2
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

// modal
function openAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
