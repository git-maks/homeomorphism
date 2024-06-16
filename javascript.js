let graph1 = [];
let graph2 = [];
let graph2Vertices = 0;

function createGraph(graphNumber) {
    let graph = prompt(`Enter the adjacency list for Graph ${graphNumber} (e.g., "0-1,0-2,1-2")`);
    if (graphNumber === 1) {
        graph1 = parseGraph(graph);
        document.getElementById('graph1').innerText = `Graph 1: ${JSON.stringify(graph1)}`;
    } else {
        graph2 = parseGraph(graph);
        graph2Vertices = new Set(graph2.flat()).size;
        document.getElementById('graph2').innerText = `Graph 2: ${JSON.stringify(graph2)}`;
        document.getElementById('modify-graph2-container').style.display = 'block';
    }
}

function parseGraph(graphString) {
    return graphString.split(',').map(edge => edge.split('-').map(Number));
}

function addVertex() {
    let edge = prompt("Enter the new edge to add (e.g., '2-3')");
    let [v1, v2] = edge.split('-').map(Number);
    if (degree(v1) === 2 || degree(v2) === 2) {
        alert("Vertices must have a degree of 2 to add.");
        return;
    }
    graph2.push([v1, v2]);
    graph2Vertices = new Set(graph2.flat()).size;
    document.getElementById('graph2').innerText = `Graph 2: ${JSON.stringify(graph2)}`;
}

function removeVertex() {
    let vertex = Number(prompt("Enter the vertex to remove"));
    if (degree(vertex) !== 2) {
        alert("Only vertices with a degree of 2 can be removed.");
        return;
    }
    graph2 = graph2.filter(edge => !edge.includes(vertex));
    graph2Vertices = new Set(graph2.flat()).size;
    document.getElementById('graph2').innerText = `Graph 2: ${JSON.stringify(graph2)}`;
}

function degree(vertex) {
    return graph2.filter(edge => edge.includes(vertex)).length;
}

function checkHomeomorphism() {
    if (graph1.length !== graph2.length || graph2Vertices !== new Set(graph1.flat()).size) {
        alert("Graphs are not homeomorphic.");
        return;
    }
    document.getElementById('graph1-container').style.backgroundColor = 'lightgreen';
    document.getElementById('graph2-container').style.backgroundColor = 'lightgreen';
    alert("Graphs are homeomorphic!");
}
