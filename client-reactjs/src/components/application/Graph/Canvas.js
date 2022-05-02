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
  static init(container, minimapContainer, readOnly) {
     return new Graph({
      container: container.current,
      autoResize: true,
      grid: true,
      history: {
        enabled: readOnly ? false : true,
        beforeAddCommand(event, args) {
          // if return false, command will not be added to undo stack
          if (args.options?.ignoreEvent) return false   
          const ignoreEvents = ['ports','tools','children','parent'];
          if (args.key && ignoreEvents.includes(args.key)) return false;
          // console.log('-event, args-----------------------------------------');
          // console.dir({event, args}, { depth: null });
          // console.log('------------------------------------------');
          return true;
        },
      },
      embedding: {
        enabled:  readOnly ? false : true,
        findParent({ node }) {

          const bbox = node.getBBox() // DRAGGED NODE BOUNDARY BOX
          
          return this.getNodes().filter((node) => {
            const data = node.getData()
            if (data.type === 'Sub-Process') {
              const targetBBox = node.getBBox() // SUBPROCESS BOUNDARY BOX
              return bbox.isIntersectWithRect(targetBBox)
            }
            return false
          })
        }
      },
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
                stroke: '#47bfdd', 
                strokeWidth:"4",
                strokeLinecap:"round",
                strokeDasharray: '0 10',
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
        enabled:  (cell) => {
          if (cell.data?.type === 'Sub-Process' && !cell.data?.isCollapsed ) return true
          return false
        } 
      },
      keyboard:  readOnly ? false : true,
      clipboard:  readOnly ? false : true,
    });
  }
}


