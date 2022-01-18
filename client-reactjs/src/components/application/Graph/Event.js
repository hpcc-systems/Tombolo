import { debounce } from "lodash";

export default class Event {
  static init(graph, graphRef) {
    graph.on('node:mouseenter', ({ node }) => {
      // Show visible ports
      const ports = graphRef.current.querySelectorAll('.x6-port-body');
      ports.forEach(port => (port.style.visibility = 'visible'));
      // add a remove button
      node.addTools([
        {
          name: 'button-remove',
   
        },
        {
          name: 'button',
          args: {
            markup: [
              {
                tagName: 'text',
                textContent: 'Hide',
                selector: 'icon',
                attrs: {
                  fill: '#fe854f',
                  textAnchor: 'middle',
                  cursor: 'pointer',
                  fontSize: '13px',
                },
              },
            ],
            x: '100%',
            y: 3,
            // offset: { x: -20, y: 10 },
            onClick({ cell }) {
              console.log('hello');
            },
          },
        },
      ]);
    });

    graph.on('node:mouseleave', ({ node }) => {
      // hide visible ports
      const ports = graphRef.current.querySelectorAll('.x6-port-body');
      ports.forEach(port => (port.style.visibility = 'hidden'));
      // hide remove button
      node.removeTools();
    });

    graph.on('edge:mouseenter', ({ edge }) => {
      //add a remove button to edge
      edge.addTools({ name: 'button-remove', args: { distance: -40 } });
    });

    graph.on('edge:mouseleave', ({ edge }) => {
      //hide a remove button
      edge.removeTools();
    });

    graph.on('node:added', ({ node, index, options }) => { })
    graph.on('node:removed', ({ node, index, options }) => { })
    graph.on('node:changed', ({ node, options }) => { this.saveChanges(graph) })
    
    graph.on('edge:added', ({ edge, index, options }) => { })
    graph.on('edge:removed', ({ edge, index, options }) => { })
    graph.on('edge:changed', ({ edge, options }) => { })


  }

 static saveChanges(graph){
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    console.log('-nodes-----------------------------------------');
    console.dir({nodes,edges}, { depth: null });
    console.log('------------------------------------------');
  }

  


}
