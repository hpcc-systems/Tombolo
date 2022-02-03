import Modal from 'antd/lib/modal/Modal';
import eyeSvg from './Icons/eye-invisible.svg'

import { ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

export default class Event {
  static init(graph, graphRef) {
    graph.on('node:mouseenter', ({ node }) => {
      // Show visible ports
      const ports = graphRef.current.querySelectorAll('.x6-port-body');
      ports.forEach(port => (port.style.visibility = 'visible'));
      // add a remove button
      // const tools = [{ name: 'button-remove', }];

      const tools = [
        {
          name: 'button',
          args: {
            markup: [
              {
                tagName: 'circle',
                selector: 'button',
                attrs:{
                  r: 6,
                  stroke: '#ff0000',
                  fill: '#ff0000',
                  cursor: 'pointer',
                }
              },
              {
                tagName: 'text',
                textContent: 'X',
                selector: 'icon',
                attrs: {
                  fill: '#ffffff',
                  y:3,
                  "font-weight": 700,
                  'font-size': 9,
                  'text-anchor': 'middle',
                  'pointer-events': 'none',
                },
              }
        
            ],
            x: 0,
            y: 0,
            offset: { x: 5, y: 4},
            onClick(param) { 
               const cell = param.cell;
               const nodeData = cell.getData();
               Modal.confirm({
                icon: <ExclamationCircleOutlined style={{color: "red"}} />,
                title: `Do you really want to remove ${nodeData.title}?`,
                okText: 'Yes',
                cancelText: 'No',
                okButtonProps: {type: 'danger'},
                cancelButtonProps: {type: 'primary'},
                onOk(){
                  cell.remove();
                },
                onCancel() {
                  return;
                }
              });
             },
          },
        },
      ];


      if (node.data.type !== 'Job'){
        const hideButton =  {
          name: 'button',
          args: {
            x: "100%",
            y: 0,
            offset: { x: -13, y: -3},
            markup: [
              {
                tagName: 'image',
                selector: 'icon',
                attrs: {
                  width: 14,
                  height: 14,
                  cursor: 'pointer',
                  'xlink:href': eyeSvg,
                },
              },
            ],
            onClick({ cell }) {
              const nodeData = cell.getData();
              Modal.confirm({
                icon: <ExclamationCircleOutlined style={{color: "red"}} />,
                title: `Do you really want to hide ${nodeData.title}?`,
                okText: 'Yes',
                cancelText: 'No',
                okButtonProps: {type: 'danger'},
                cancelButtonProps: {type: 'primary'},
                onOk(){
                  cell.hide({ name: "update-asset" });
                },
                onCancel() {
                  return;
                }
              });
             console.log('-cell-----------------------------------------');
             console.dir({cell}, { depth: null });
             console.log('------------------------------------------');
             
            },
          },
        };
        tools.push(hideButton);
      }
      
      node.addTools(tools);
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

    // graph.on('node:added', ({ node, index, options }) => { })
    // graph.on('node:removed', ({ node, index, options }) => { })
    // graph.on('node:changed', ({ node, options }) => { })
    
    // graph.on('edge:added', ({ edge, index, options }) => { })
    // graph.on('edge:removed', ({ edge, index, options }) => { })
    // graph.on('edge:changed', ({ edge, options }) => { })


  }
}
