import { Graph, Shape, NodeView } from '@antv/x6';
import './Shape';
class SimpleNodeView extends NodeView {
  renderMarkup() {
     return this.renderJSONMarkup({
       tagName: 'rect',
       selector: 'body',
     })
   }
 
   update() {
     super.update({
       body: {
         refWidth: '100%',
         refHeight: '100%',
         fill: '#31d0c6',
       },
     })
   }
 }
 
export default class Canvas {
  static graph;

  static init(container, minimapContainer) {
    const graph = new Graph({
      container: container.current,
      autoResize: true,
      grid: true,
      history: true,
      scroller: {
        enabled: true,
        pageVisible: false,
        pageBreak: false,
        pannable: true,
        className: 'custom-scroll',
      },
      minimap: {
        enabled: true,
        container: minimapContainer.current,
        width: 200,
        height: 160,
        padding: 10,
        graphOptions: {
          async: true,
          getCellView(cell) {
            if (cell.isNode()) {
              return SimpleNodeView
            }
          },
          createCellView(cell) {
            if (cell.isEdge()) {
              return null
            }
          },
        },
      },
      selecting: {
        strict:false,
        enabled: true,
        multiple: true,
        rubberband: true,
        modifiers: 'shift',
        showNodeSelectionBox: true,
      },
      panning: {
        enabled: true,
        modifiers: 'ctrl',
      },
      connecting: {
        allowBlank: false,
        allowMulti: true,
        allowLoop: true,
        allowNode: true,
        allowEdge: false,
        allowPort: false,
        highlight: true,
        connectionPoint: {
          name:'boundary',
          args:{
            offset: 10,
            sticky:true
          },
        },
        anchor: 'center',
        // router: {
        //   name: 'orth',
        // },
        connector: {
          name: 'jumpover',
          args: {
            type: 'gap',
            radius: 10
          },
        },
        snap: {
          radius: 40,
        },
         validateEdge({ edge }) {
          // const source = edge.getSourceCell().data;
          // const target= edge.getTargetCell().data;
          // if node is not assigned to any of assets prevent it from being connected
          // if (!source?.assetId || !target?.assetId) return false;
          
          return true // DEFAULT 
        },
        createEdge() {
          return new Shape.Edge({
            zIndex: -1,
            attrs: {
              line: {
                stroke: '#47bfdd', // manually 
              },
            },
          });
        },
      },
      mousewheel: {
        enabled: true,
        zoomAtMousePosition: true,
        modifiers: 'ctrl',
        minScale: 0.5,
        maxScale: 3,
      },
      snapline: {
        enabled: true,
        sharp: true,
      },
      resizing: {
        enabled: false,
      },
      keyboard: true,
      clipboard: true,
    
    });
    this.graph = graph;
    return graph;
  }
}


