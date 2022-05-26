import React, { useEffect, useState } from 'react';
import { Menu } from '@antv/x6-react-components';
import { Empty } from 'antd';

const MenuItem = Menu.Item; // eslint-disable-line
const Divider = Menu.Divider; // eslint-disable-line

const HiddenNodesList = ({ graphRef, refresh, setRefresh }) => {
  const [nodes, setNodes] = useState([]);

  const showNode = (node) => {
    node.show({ name: 'update-asset' });
    setRefresh((prev) => !prev);
    const edges = graphRef.current.getConnectedEdges(node, { incoming: true, outgoing: true });
    edges.forEach((edge) => {
      edge.setVisible(true);
      edge.toBack();
    }); // this will update each edge to be visible
  };

  const showAllNodes = (nodes) => {
    nodes.forEach((node) => {
      node.show({ name: 'update-asset' });
      const edges = graphRef.current.getConnectedEdges(node, { incoming: true, outgoing: true });
      edges.forEach((edge) =>{
        edge.setVisible(true);
        edge.toBack();
      }); // this will update each edge to be visible
    });
    setRefresh((prev) => !prev);
  };

  useEffect(() => {
    const hiddenNodes = graphRef.current.getNodes().filter((node) => !node.isVisible());
    setNodes(() => hiddenNodes);
  }, [refresh, graphRef]);

  if (!nodes.length)
    return (
      <Menu>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Menu>
    );

  return (
    <Menu>
      <MenuItem onClick={() => showAllNodes(nodes)}>Reset all hidden nodes</MenuItem>
      <Divider />
      {nodes.map((node) => {
        return (
          <MenuItem key={node.id} onClick={() => showNode(node)}>
            {node.data.title}
          </MenuItem>
        );
      })}
    </Menu>
  );
};

export default HiddenNodesList;
