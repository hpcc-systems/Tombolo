import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import '@antv/x6-react-shape';
import { message } from 'antd';
import { debounce } from 'lodash';

import Event from '../Graph/Event';
import Canvas from '../Graph/Canvas';
import Stencil from '../Graph/Stencil';
import Keyboard from '../Graph/Keyboard';
import { useSelector } from 'react-redux';

import AssetDetailsDialog from '../AssetDetailsDialog';
import ExistingAssetListDialog from './ExistingAssetListDialog';
import SubProcessDialog from './SubProcessDialog';

const defaultState = {
  openDialog: false,
  subProcessId: '',
  assetId: '',
  title: '',
  name: '',
  type: '',
  nodeId: '',
  cell: null,
  nodes: [], // ?? not sure if needed
  edges: [], // ?? not sure if needed
};

function GraphX6() {
  const graphRef = useRef();
  const graphContainerRef = useRef();
  const stencilContainerRef = useRef();

  const { applicationId, dataflowId } = useSelector((state) => state.dataflowReducer);

  const [configDialog, setConfigDialog] = useState({ ...defaultState });

  useEffect(() => {
    const graph = Canvas.init(graphContainerRef.current);
    graphRef.current = graph;
    Stencil.init(stencilContainerRef.current, graph);
    Event.init(graph, graphContainerRef); // some static event that does not require local state changes will be sitting here
    Keyboard.init(graph);

    // get saved graph
    (async () => {
      try {
        const response = await fetch(
          `/api/dataflowgraph?application_id=${applicationId}&dataflowId=${dataflowId}`,
          { headers: authHeader() }
        );
        if (!response.ok) handleError(response);
        const data = await response.json();

        if (data) {
          // Nodes and Edges comes as a string, need to parse it to object
          const nodes = data.nodes ? JSON.parse(data.nodes) : [];
          const edges = data.edges ? JSON.parse(data.edges) : [];

          nodes.forEach((node) => {
            graph.addNode({
              id: node.id,
              x: node.x,
              y: node.y,
              shape: 'custom-shape',
              data: {
                type: node.type,
                title: node.title,
                assetId: node.assetId,
                subProcessId: node.subProcessId,
              },
            });
          });

          edges.forEach((edge) => {
            graph.addEdge({ source: edge.source, target: edge.target });
          });
        }
      } catch (error) {
        console.log(error);
        message.error('Could not download graph nodes');
      }
    })();

    graph.on('node:removed', async ({ cell }) => {
      const nodeData = cell.getData();
      try {
        /* deleting asset from dataflow is multi step operation
        1. delete asset from Asset_Dataflow table
        2. make sure that any Job scheduled with this asset is deleted too
        3. update graph in Dataflowgraph table */
        if (nodeData.assetId) {
          const options = {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ id: nodeData.assetId, type: nodeData.type, dataflowId }),
          };

          const response = await fetch('/api/dataflowgraph/deleteAsset', options);
          if (!response.ok) handleError(response);
        }

        await handleSave(graph);
      } catch (error) {
        console.log(error);
        message.error('Could not delete an asset');
      }
    });

    graph.on('node:dblclick', ({ node, cell }) => {
      const nodeData = cell.getData();
      setConfigDialog(() => ({
        ...nodeData,
        nodeId: node.id,
        openDialog: true,
        cell,
        nodes: graph.getEdges(),
        edges: graph.getNodes(),
      }));
    });

    graph.history.on('change', async ({ cmds, options }) => {
      if (cmds[0].event === 'cell:change:tools') return; // ignoring hover events
      // console.log('-cmds, options-----------------------------------------');
      // console.dir({cmds, options}, { depth: null });
      // console.log('------------------------------------------');
      const actions = ['dnd', 'resize', 'mouse', 'add-edge', 'add-asset', 'update-asset'];
      if (actions.includes(options?.name)) {
        await handleSave(graph);
        console.log(`saved`);
      }
    });
  }, []);

  const handleSave = debounce(async (graph) => {
    const nodes = graph.getNodes().map((node) => {
      const nodeData = node.data;
      return {
        id: node.id,
        x: node.getPosition().x,
        y: node.getPosition().y,
        ...nodeData,
      };
    });

    const edges = graph.getEdges().map((edge) => ({
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
    }));

    try {
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ nodes, edges, application_id: applicationId, dataflowId }),
      };

      const response = await fetch('/api/dataflowgraph/save', options);
      if (!response.ok) handleError(response);

      const data = await response.json();
      console.log('------------------------------------------');
      console.log('Graph saved');
      console.dir({ data }, { depth: null });
      console.log('------------------------------------------');
    } catch (error) {
      console.log(error);
      message.error('Could not save graph');
    }
  }, 1000);

  const saveNewAsset = async (newAsset) => {
    if (newAsset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/
      cell.updateData(
        {
          name: newAsset.name,
          title: newAsset.title,
          assetId: newAsset.id,
          nodeId: configDialog.nodeId,
          subProcessId: newAsset.jobType === 'Sub-Process' ? newAsset.id : undefined,
        },
        { name: 'add-asset' }
      );

      try {
        const options = {
          method: 'POST',
          headers: authHeader(),
          body: JSON.stringify({ assetId: newAsset.id, dataflowId }),
        };

        /* this POST will create record in asset_dataflows table*/
        const response = await fetch('/api/dataflow/saveAsset', options);
        if (!response.ok) handleError(response);

        const jobtypes = ['Job', 'Modeling', 'Scoring', 'ETL', 'Query Build', 'Data Profile'];

        if (configDialog.type === 'Job' && jobtypes.includes(newAsset.jobType)) {
          // CREATE JOB FILE RELATIONSHIP
          const options = {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ jobId: newAsset.id, dataflowId }),
          };
          const response = await fetch('/api/job/jobFileRelation', options);
          if (!response.ok) handleError(response);
          const realtedFiles = await response.json();

          if (realtedFiles.length > 0) {
            // 1. get all files,
            const allNodes = graphRef.current.getNodes();
            realtedFiles.forEach((relatedFile, index) => {
              // 2. find all existing files on graph and add edge to point to them
              const nodeExistsOnGraph = allNodes.find((node) => {
                return node.data.type === 'File' && node.data.assetId === relatedFile.assetId;
              });

              if (nodeExistsOnGraph) {
                graphRef.current.addEdge({ source: cell, target: nodeExistsOnGraph }, { name: 'add-asset' });
              } else {
                // 3. create file nodes, place input file on top and output below job node.
                const nodePositions = cell.getProp('position');
                const newNode = graphRef.current.addNode({
                  x: nodePositions.x + index * 70,
                  y: relatedFile.file_type === 'input' ? nodePositions.y + 70 : nodePositions.y - 70,
                  shape: 'custom-shape',
                  data: {
                    type: 'File',
                    name: relatedFile.name,
                    title: relatedFile.title,
                    assetId: relatedFile.assetId,
                    subProcessId: undefined,
                  },
                });
                graphRef.current.addEdge({ source: cell, target: newNode }, { name: 'add-asset' });
              }
            });
          }
        }
      } catch (error) {
        console.log(error);
        message.error('Could not download graph nodes');
      }
    }

    setConfigDialog({ ...defaultState }); // RESETS LOCAL STATE AND CLOSES DIALOG
  };

  const updateAsset = (asset) => {
    if (asset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/
      //add icons or statuses
      cell.updateData({ title: asset.title }, { name: 'update-asset' });
    }
    setConfigDialog({ ...defaultState }); // RESETS LOCAL STATE AND CLOSES DIALOG
  };

  return (
    <>
      <div id="container">
        <div id="stencil" ref={stencilContainerRef} />
        <div id="graph-container" ref={graphContainerRef} />
      </div>

      {configDialog.openDialog && configDialog.assetId ? (
        <AssetDetailsDialog
          show={configDialog.openDialog}
          selectedJobType={configDialog.type}
          selectedAsset={{ id: configDialog.assetId }}
          selectedDataflow={{ id: dataflowId }}
          selectedNodeId={configDialog.nodeId}
          selectedNodeTitle={configDialog.title}
          nodes={configDialog.nodes}
          edges={configDialog.edges}
          onClose={updateAsset}
          viewMode={true} // ?
          displayingInModal={true} // ?
        />
      ) : null}

      {configDialog.openDialog && !configDialog.assetId ? (
        <ExistingAssetListDialog
          assetType={configDialog.type}
          currentlyEditingNodeId={configDialog.nodeId}
          show={configDialog.openDialog}
          onClose={saveNewAsset}
          dataflowId={dataflowId}
          applicationId={applicationId}
        />
      ) : null}

      {/* {graphState.showSubProcessDetails ?         
          <SubProcessDialog
            show={graphState.showSubProcessDetails}
            applicationId={applicationId}
            selectedParentDataflow={selectedDataflow}
            onRefresh={onFileAdded}
            selectedSubProcess={graphState.selectedSubProcess}
            nodeId={graphState.currentlyEditingNode.id}/> : null} */}
    </>
  );
}

export default GraphX6;
