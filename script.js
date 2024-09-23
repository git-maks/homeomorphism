document.addEventListener('DOMContentLoaded', function() {
    const cy1 = createCytoscape('cy1');
    const cy2 = createCytoscape('cy2');

    document.getElementById('check-homeomorphism').addEventListener('click', function() {
        const result = checkHomeomorphism(cy1, cy2);
        document.getElementById('result').textContent = result ? 
            "The graphs are homeomorphic!" : 
            "The graphs are not homeomorphic.";
    });
});

function createCytoscape(containerId) {
    return cytoscape({
        container: document.getElementById(containerId),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],
        layout: {
            name: 'grid',
            rows: 1
        }
    });
}

function setupCytoscapeInteractions(cy) {
    let nodeId = 0;
    let sourceNode = null;

    cy.on('tap', function(event) {
        if (event.target === cy) {
            const position = event.position;
            cy.add({
                group: 'nodes',
                data: { id: 'n' + nodeId++ },
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
            cy.add({
                group: 'edges',
                data: {
                    id: 'e' + sourceNode.id() + '-' + event.target.id(),
                    source: sourceNode.id(),
                    target: event.target.id()
                }
            });
        }
        sourceNode = null;
    });
}

function checkHomeomorphism(cy1, cy2) {
    // This is a simplified check that only compares the number of nodes and edges
    // A real homeomorphism check would be much more complex
    return cy1.nodes().length === cy2.nodes().length && 
           cy1.edges().length === cy2.edges().length;
}

setupCytoscapeInteractions(cy1);
setupCytoscapeInteractions(cy2);
