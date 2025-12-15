# Node Connection and Graph Management Issues

## Problem Statement

Three critical issues affect the user experience when interacting with the graph visualization:

1. **Node Connection Conflict**: Left-clicking and dragging from an existing node moves the node instead of creating edges. Users cannot connect nodes because the drag-to-connect mechanism conflicts with the drag-to-move behavior.

2. **Node Numbering Gaps**: When a node is deleted (e.g., node 2), the next created node uses the next counter value (node 3), leaving permanent gaps in the numbering sequence. Existing nodes are not renumbered to maintain sequential IDs.

3. **Incomplete Graph Cleanup**: When loading example graphs, user-created graphs are not properly cleared, potentially leaving residual state or interfering with the fresh example data.

## Solution Overview

### 1. Edge Creation Mechanism Redesign

**Current Behavior**: 
The mousedown/mouseup events on nodes are used for edge creation, but Cytoscape's default dragging behavior takes precedence, causing nodes to move instead of creating connections.

**Proposed Solution**:
Implement a selection-based edge creation workflow that separates node movement from edge creation:

- First click on a node selects it as the source (visual feedback provided)
- Second click on a different node creates an edge between source and target
- Click on empty space or the same node deselects
- Node dragging remains available but does not interfere with edge creation

**Interaction Flow**:

| User Action | System Response |
|-------------|----------------|
| Click node (no source selected) | Mark node as source, apply visual highlight |
| Click different node (source selected) | Create edge from source to target, clear selection |
| Click same node (source selected) | Clear selection, remove highlight |
| Click empty space (source selected) | Clear selection, remove highlight |
| Right-click node | Delete node (unchanged) |
| Drag node | Move node position (unchanged) |

**Visual Feedback**:
- Selected source node: distinct border color and increased border width
- Cursor change when hovering over potential target nodes

### 2. Sequential Node Renumbering System

**Current Behavior**:
Node IDs are assigned using monotonically increasing counters (nodeIdCounter1, nodeIdCounter2) that never decrease, causing gaps when nodes are deleted.

**Proposed Solution**:
Implement dynamic node renumbering that maintains sequential numbering:

**Renumbering Strategy**:

After any node deletion:
1. Collect all existing node IDs and extract their numeric portions
2. Sort nodes by their current numeric ID
3. Reassign IDs sequentially starting from 0
4. Update all edge references to use the new node IDs
5. Reset the counter to the next available number

**ID Assignment for New Nodes**:
- Find the smallest available number not currently in use
- If all numbers 0 to N are taken, use N+1

**Preservation Requirements**:
- Maintain all existing edges during renumbering
- Update edge source/target references atomically
- Preserve node positions
- Handle renumbering for both graphs independently

**Example Scenario**:

```
Initial state: nodes n0, n1, n2, n3
User deletes n1
After renumbering: n0, n1 (was n2), n2 (was n3)
Next created node: n3
```

### 3. Complete Graph Reset on Example Load

**Current Behavior**:
The loadExample function clears elements using cy1.elements().remove() and cy2.elements().remove(), and resets counters and history, but may not properly handle all state.

**Proposed Solution**:
Implement comprehensive graph reset procedure:

**Reset Checklist**:

| Component | Action |
|-----------|--------|
| Graph elements | Remove all nodes and edges from both Cytoscape instances |
| Node ID counters | Reset to 0 for both graphs |
| History stacks | Clear history1, history2 arrays |
| History indices | Reset historyIndex1, historyIndex2 to -1 |
| UI state | Update undo/redo button states |
| Selection state | Clear any selected source nodes from edge creation workflow |
| Visual state | Remove all temporary highlights or styles |

**Loading Sequence**:
1. Execute complete reset procedure
2. Load new graph nodes with predefined IDs
3. Load new graph edges
4. Calculate and set counters based on maximum ID in loaded example
5. Display confirmation message

**Counter Synchronization**:
After loading example graphs, set counters to the maximum node ID found in the example plus one, ensuring new nodes continue the sequence without conflicts.

## Implementation Considerations

### State Management

**Edge Creation State** (new):
- sourceNodeId: stores the currently selected source node ID (null when no selection)
- graphInstance: tracks which graph the source belongs to

**Node Renumbering**:
- Function must be idempotent and safe to call after any deletion
- Edge ID format remains "e{sourceId}-{targetId}"

### Event Handler Modifications

**setupCytoscapeInteractions** requires restructuring:

**Remove**:
- mousedown/mouseup handlers for edge creation

**Add**:
- Single click (tap) handler for node selection and edge creation
- Selection state management
- Visual feedback for selected nodes

**Preserve**:
- Right-click (cxttap) for node deletion
- Empty space click for node creation
- Default drag behavior for node movement

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Select source, then delete it | Clear selection state automatically |
| Select source in graph A, click node in graph B | No edge created, selection cleared |
| Edge already exists between selected nodes | Skip creation, show no error, clear selection |
| Renumber with orphaned edges | Should not occur; deletion removes connected edges |
| Load example while source node selected | Clear selection during reset |

## User Experience Impact

### Before Fix
- Users frustrated by inability to connect nodes
- Confusing node numbering with gaps
- Uncertainty about graph state when loading examples

### After Fix
- Clear two-click workflow for edge creation
- Always sequential, predictable node numbering
- Clean slate when loading examples

## Validation Criteria

1. **Edge Creation**: User can select a source node (visual feedback shown), then click target to create edge
2. **Node Movement**: Dragging nodes still works without triggering edge creation
3. **Sequential Numbering**: After deleting any node, remaining nodes are renumbered sequentially starting from n0
4. **Clean Example Load**: Loading any example graph completely clears previous state and starts fresh
5. **Cross-Graph Isolation**: Selecting source in one graph and clicking in another graph does not create edges
6. **Undo/Redo Compatibility**: Renumbering and new edge creation integrate properly with history system
