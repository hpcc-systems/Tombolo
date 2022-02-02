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
      container: container,
      autoResize: true,
      grid: true,
      history: true,
      // scroller: {
      //   enabled: true,
      //   pageVisible: false,
      //   pageBreak: false,
      //   pannable: true,
      // },
      minimap: {
        enabled: true,
        container: minimapContainer,
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
        strict:true,
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
        allowEdge: true,
        allowPort: false,
        highlight: true,
        // router: 'manhattan',
        connector: {
          name: 'rounded',
          // args: {
          //   radius: 2,
          // },
        },
        // snap: {
        //   radius: 10,
        // },
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
        enabled: true,
        orthogonal: false,
        restricted: false,
        allowReverse: false,
        preserveAspectRatio: false,
      },
      keyboard: true,
      clipboard: true,
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          zIndex: 0,
        });
      },
    });

    this.graph = graph;
    return graph;
  }
}


