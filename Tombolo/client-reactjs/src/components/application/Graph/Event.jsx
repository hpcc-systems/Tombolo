import React from 'react';
import { Modal } from 'antd';
import eyeSvg from './Icons/eye-invisible.svg';

import { ExclamationCircleOutlined } from '@ant-design/icons';

export default class Event {
  static init(graph) {
    graph.on('node:mouseenter', ({ node }) => {
      //Ports are added to each node by default but in case of Files we dont want it to be connected to random job, it should be always synced with hpccc.
      //best way to avoid file being connected is to hide ports
      // Show visible ports
      const ports = node.getPorts();
      if (ports) {
        ports.forEach((port) =>
          node.setPortProp(port.id, 'attrs/circle/style', { visibility: 'visible' }, { ignoreEvent: true })
        );
      }

      const deleteButton = {
        name: 'button',
        args: {
          markup: [
            {
              tagName: 'circle',
              selector: 'button',
              attrs: {
                r: 6,
                stroke: '#ff0000',
                fill: '#ff0000',
                cursor: 'pointer',
              },
            },
            {
              tagName: 'text',
              textContent: 'X',
              selector: 'icon',
              attrs: {
                fill: '#ffffff',
                y: 3,
                'font-weight': 700,
                'font-size': 9,
                'text-anchor': 'middle',
                'pointer-events': 'none',
              },
            },
          ],
          x: 0,
          y: 0,
          offset: { x: 21, y: 4 },
          onClick(param) {
            const cell = param.cell;
            const nodeData = cell.getData();

            const deleteMessages = {
              Job: `Removing a job will remove all related files from workflow. Do you really want to remove ${nodeData.title}?`,
              'Sub-Process': `Removing a Sub-Process will remove all its nested assets from workflow. Do you really want to remove ${nodeData.title}?`,
              default: `Do you really want to remove ${nodeData.title}?`,
            };

            const title = deleteMessages[nodeData.type] || deleteMessages.default;

            Modal.confirm({
              icon: <ExclamationCircleOutlined style={{ color: 'red' }} />,
              title,
              okText: 'Yes',
              cancelText: 'No',
              okButtonProps: { type: 'danger' },
              cancelButtonProps: { type: 'primary' },
              onOk() {
                if (nodeData.type === 'Job') {
                  // REMOVE ALL RELATED Files
                  const incomingEdges = graph.getIncomingEdges(cell);
                  const outgoingEdges = graph.getOutgoingEdges(cell);

                  if (incomingEdges) {
                    incomingEdges.forEach((edge) => {
                      const source = edge.getSourceNode();
                      if (source) {
                        const isFileOrTemplate = source.data.type === 'File' || source.data.type === 'FileTemplate';
                        if (isFileOrTemplate) {
                          const connectedEdges = graph.getConnectedEdges(source);
                          if (connectedEdges.length === 1 && !source.data.isMonitoring) {
                            source.remove();
                          }
                        }
                      }
                    });
                  }

                  if (outgoingEdges) {
                    outgoingEdges.forEach((edge) => {
                      const target = edge.getTargetNode();
                      if (target) {
                        const isFileOrTemplate = target.data.type === 'File' || target.data.type === 'FileTemplate';
                        if (isFileOrTemplate) {
                          const connectedEdges = graph.getConnectedEdges(target);
                          if (connectedEdges.length === 1 && !target.data.isMonitoring) {
                            target.remove();
                          }
                        }
                      }
                    });
                  }
                }
                // REMOVE NODE ITSELF
                cell.remove();
              },
              onCancel() {
                return;
              },
            });
          },
        },
      };

      const hideButton = {
        name: 'button',
        args: {
          x: '100%',
          y: 0,
          offset: { x: -26, y: -4 },
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
              icon: <ExclamationCircleOutlined style={{ color: 'red' }} />,
              title: `Do you really want to hide ${nodeData.title}?`,
              okText: 'Yes',
              cancelText: 'No',
              okButtonProps: { type: 'danger' },
              cancelButtonProps: { type: 'primary' },
              onOk() {
                cell.hide({ name: 'update-asset' });
              },
              onCancel() {
                return;
              },
            });
          },
        },
      };

      const tools = [deleteButton, hideButton];
      if (node.data.type === 'Sub-Process') tools.pop(); // do not show hide button for sub process, it will mess up remove a frame of subprocess and cause some errors;

      node.addTools(tools, { ignoreEvent: true });
    });

    graph.on('node:mouseleave', ({ node }) => {
      // hide visible ports
      const ports = node.getPorts();
      ports.forEach((port) =>
        node.setPortProp(port.id, 'attrs/circle/style', { visibility: 'hidden' }, { ignoreEvent: true })
      );
      // hide remove button
      node.removeTools({ ignoreEvent: true });
    });

    graph.on('edge:mouseenter', ({ edge }) => {
      // do show delete edge button if its a schedule edge;
      const isScheduled = edge.getData()?.scheduled;
      if (isScheduled) return;

      //add a remove button to edge
      edge.addTools({ name: 'button-remove' }, { ignoreEvent: true });
    });

    graph.on('edge:mouseleave', ({ edge }) => {
      //hide a remove button
      edge.removeTools({ ignoreEvent: true });
    });

    // graph.on('node:added', ({ node, index, options }) => { })
    // graph.on('node:changed', ({ node, options }) => { })
    // graph.on('node:removed', ({ node, index, options }) => { })

    // graph.on('edge:added', ({ edge, index, options }) => { })
    // graph.on('edge:removed', ({ edge, index, options }) => { })
    // graph.on('edge:changed', ({ edge, options }) => { })
  }
}
