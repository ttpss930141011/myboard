# Frame Component Design Documentation

## Overview
The Frame component is a foundational element in our collaborative whiteboard application that provides **visual grouping and hierarchical organization** of canvas elements. It implements **Miro-inspired adoption mechanism** with **50% overlap rule** for automatic child element management.

## Core Architecture

### Component Structure
```typescript
interface FrameProps {
  id: string           // Unique frame identifier
  layer: FrameLayer   // Frame data from store
  onPointerDown?: (e: React.PointerEvent, id: string) => void
  selectionColor?: string  // Visual selection feedback
  children?: React.ReactNode  // Child elements for rendering
}
```

### FrameLayer Type Definition
```typescript
type FrameLayer = {
  type: LayerType.Frame
  x: number              // Absolute x coordinate
  y: number              // Absolute y coordinate  
  height: number         // Frame height in pixels
  width: number          // Frame width in pixels
  fill?: Color           // Optional background color
  strokeColor?: Color    // Border color (default: #E5E7EB)
  strokeWidth?: number   // Border width (default: 2px)
  childIds: string[]     // Array of adopted child element IDs
  name?: string          // Editable frame label
  locked?: boolean       // Future: lock/unlock functionality
}
```

## Visual Design System

### Frame Appearance
- **Border Style**: Dashed border (`strokeDasharray="6 3"`) for visual distinction
- **Border Radius**: 8px rounded corners for modern appearance
- **Default Colors**: 
  - Border: `#E5E7EB` (gray-200)
  - Background: Transparent or user-defined fill color
- **Selection Feedback**: Drop shadow with selection color

### Label System
- **Position**: Top-left, 8px offset from frame edge, -24px vertical offset
- **Styling**: White background, gray text, rounded corners
- **Constraints**: Max width 200px, truncated with ellipsis
- **Editing**: Double-click to edit, auto-resize input width

### Clipping Architecture
Each frame creates an SVG `clipPath` to ensure child elements are visually contained:
```svg
<clipPath id="frame-clip-{id}">
  <rect x={x} y={y} width={width} height={height} rx={8} ry={8} />
</clipPath>
```

## Child Adoption Mechanism

### Miro-Inspired 50% Overlap Rule
The Frame component implements **intelligent child adoption** based on spatial overlap analysis:

#### Adoption Logic
1. **Overlap Calculation**: When elements are created or moved, system calculates intersection area
2. **50% Threshold**: Element is adopted if ≥50% of its area overlaps with frame bounds  
3. **Best Parent Selection**: Multi-frame overlap chooses frame with highest overlap percentage
4. **Automatic Management**: No manual drag-and-drop required

#### Implementation Details
```typescript
// Canvas Store: Auto-adoption on element creation
const layer = get().layers.get(id)
if (layer) {
  const frames = get().getFrameLayers()
  const bestParent = findBestParentFrame(layer, frames)
  
  if (bestParent) {
    get().adoptElement(bestParent.id, id)
  }
}
```

### Parent-Child Data Management

#### Storage Structure
- **Frame Layer**: `childIds: string[]` - Array of adopted child IDs
- **Performance Indexes**: 
  - `parentIndex: Map<string, string>` - O(1) child→parent lookup
  - `childrenIndex: Map<string, Set<string>>` - O(1) parent→children lookup

#### Store Operations
```typescript
// Adopt element into frame
adoptElement(frameId: string, elementId: string): void

// Release element from current parent
releaseElement(elementId: string): void

// Update parentship based on current position (50% rule)
updateElementParentship(elementId: string): void

// Get all frame layers with performance caching
getFrameLayers(): (Layer & { id: string })[]
```

## Coordinate System

### Absolute Positioning
All elements use **absolute canvas coordinates**, including frame children:
- **Frame Bounds**: `{x, y, width, height}` define container area
- **Child Positioning**: Children maintain their absolute coordinates
- **Visual Clipping**: SVG clipPath provides visual containment without coordinate transformation
- **Translation Behavior**: Moving frame translates all children by same offset

### Benefits of Absolute Coordinates
1. **Performance**: No coordinate transformation calculations
2. **Consistency**: Single coordinate system across entire canvas
3. **Flexibility**: Children can be easily moved between frames
4. **Selection**: Unified selection and manipulation logic

## Performance Optimizations

### Frame Caching System
```typescript
interface FrameCache {
  frameIds: Set<string>
  timestamp: number     // Cache expiration tracking
  version: number       // Invalidation on layer changes
}
```

**Cache Strategy**:
- 5-second TTL for frame layer queries
- Version-based invalidation on frame additions/deletions
- O(1) frame type filtering

### Parent-Child Index Performance
- **O(1) Lookups**: `parentIndex` and `childrenIndex` for instant relationship queries
- **Batch Updates**: Efficient multi-child operations
- **Memory Optimization**: Cleanup on element deletion

## Interaction Patterns

### Selection Behavior
Frame implements **dual-state selection logic**:
- **Unselected Frames**: Click-through behavior allows child selection
- **Selected Frames**: Participate in range selection and group operations
- **Visual Feedback**: Selection color applied as drop shadow filter

### Layer Ordering Strategy
```typescript
// Smart layer insertion
if (layer.type === LayerType.Frame) {
  state.layerIds.unshift(id) // Add to beginning (back)
} else {
  state.layerIds.push(id)    // Add to end (front)
}
```

**Benefits**:
- Frames render behind content layers
- Natural z-index hierarchy
- Predictable visual stacking

## Integration with Canvas System

### Canvas Store Integration
- **History Support**: All frame operations participate in undo/redo system
- **Auto-save**: Database persistence with debounced updates
- **Event Handling**: Integrated with canvas pointer and selection events

### Tool Integration
- **Selection Tools**: Frame-aware selection and multi-selection
- **Transform Tools**: Coordinate movement and resizing with child elements
- **Drawing Tools**: Auto-adoption of newly created elements

## Future Enhancements

### Planned Features
1. **Frame Locking**: `locked` property to prevent accidental modifications
2. **Nested Frames**: Frame-within-frame hierarchical support
3. **Frame Templates**: Predefined frame sizes and styles
4. **Smart Guides**: Visual alignment assistance when moving frames
5. **Export Boundaries**: Use frames as export/screenshot boundaries

### Performance Roadmap
1. **Viewport Culling**: Skip rendering frames outside viewport
2. **Lazy Child Rendering**: Virtualized child element rendering
3. **Batch Adoption**: Optimize multi-element adoption operations

## Technical Specifications

### Dependencies
- **React**: Memo optimization for render performance
- **Zustand**: Canvas store integration with Immer middleware
- **SVG**: Native SVG for precise graphics rendering
- **TypeScript**: Full type safety and IntelliSense support

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **SVG Support**: clipPath, foreignObject, and drop-shadow filters
- **Pointer Events**: Modern pointer event handling

### Performance Metrics
- **Render Time**: <16ms for 100+ frames (60fps target)
- **Memory Usage**: ~1KB per frame with child indexes
- **Cache Hit Rate**: >95% for frame layer queries
- **Adoption Speed**: <1ms for single element adoption

---

## Usage Examples

### Creating a Frame
```typescript
const frame = useCanvasStore(state => state.insertLayer({
  type: LayerType.Frame,
  x: 100,
  y: 100,
  width: 400,
  height: 300,
  fill: { r: 240, g: 240, b: 240 },
  strokeColor: { r: 59, g: 130, b: 246 },
  strokeWidth: 3,
  childIds: [],
  name: 'User Journey Map'
}))
```

### Manual Element Adoption
```typescript
const adoptElement = useCanvasStore(state => state.adoptElement)
const releaseElement = useCanvasStore(state => state.releaseElement)

// Adopt element into frame
adoptElement('frame-id', 'element-id')

// Release from current parent
releaseElement('element-id')
```

### Querying Frame Relationships
```typescript
const getElementParent = useCanvasStore(state => state.getElementParent)
const getFrameLayers = useCanvasStore(state => state.getFrameLayers)

// Get parent frame of element
const parentId = getElementParent('element-id')

// Get all frames for overlap analysis
const frames = getFrameLayers()
```