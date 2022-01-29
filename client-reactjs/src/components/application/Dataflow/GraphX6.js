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

    // FETCH SAVED GRAPH
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
              width: node.width,
              height: node.height,
              shape: 'custom-shape',
              data: {
                type: node.type,
                title: node.title,
                assetId: node.assetId,
                scheduleType: node.scheduleType,
                subProcessId: node.subProcessId,
              },
            });
          });

          edges.forEach((edge) => {
            graph.addEdge({
              source: edge.source, 
              target: edge.target, 
              attrs: {
                line: {
                  stroke: edge.stroke,
                },
              },
            });
          });
        }
      } catch (error) {
        console.log(error);
        message.error('Could not download graph nodes');
      }

      // graph.centerContent() // Will align the center of the canvas content with the center of the viewport
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
        cell,
        nodeId: node.id,
        openDialog: true,
        edges : graph.getEdges(), // ?? not used anywhere currently
        nodes: graph.getNodes().reduce((acc, el) =>{
          const nodeData = el.getData();
          if (nodeData.assetId) acc.push(nodeData)
          return acc;
        },[]),
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
      }
    });
  }, []);

  const handleSave = debounce(async (graph) => {
    const nodes = graph.getNodes().map((node) => {
      const nodeData = node.data;
      const position = node.getPosition();
      const size = node.size()
      return {
        id: node.id,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        ...nodeData,
      };
    });

    const edges = graph.getEdges().map((edge) => ({
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      stroke: edge.getAttrByPath('line/stroke')
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
  }, 500);

  const saveNewAsset = async (newAsset) => {
    // console.time('jobFileRelation');
    if (newAsset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/
      cell.updateData({
          name: newAsset.name,
          title: newAsset.title,
          assetId: newAsset.id,
          subProcessId: newAsset.jobType === 'Sub-Process' ? newAsset.id : undefined,
        }, { name: 'add-asset' }
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

        // Getting Job - File relations set up
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
            const allFiles = graphRef.current.getNodes().filter(node => node.data.type === 'File' );
            realtedFiles.forEach((relatedFile, index) => {
              // 2. find all existing files on graph and add edge to point to them
              const fileExistsOnGraph = allFiles.find((file) => file.data.assetId === relatedFile.assetId );
              let newNode;

              if (!fileExistsOnGraph) {            
                // 3. create file nodes, place input file on top and output below job node.
                const nodePositions = cell.getProp('position');
                newNode = graphRef.current.addNode({
                  x: nodePositions.x + (index * 70),
                  y: relatedFile.file_type === 'output' ? nodePositions.y + 70 : nodePositions.y - 70,
                  shape: 'custom-shape',
                  data: {
                    type: 'File',
                    name: relatedFile.name,
                    title: relatedFile.title,
                    assetId: relatedFile.assetId,
                    subProcessId: undefined,
                  },
                });
              }
              //4. Create Edges from Job to File
              const edge = {
                target: cell, 
                source: fileExistsOnGraph ? fileExistsOnGraph : newNode,
                attrs: {
                  line: {
                    stroke: relatedFile.file_type === 'output' ? '#d64b4e': "#35991c", // red for output, green for input
                  },
                },
              }
              if ( relatedFile.file_type === 'input') {
                edge.target = fileExistsOnGraph ? fileExistsOnGraph : newNode;
                edge.source = cell;
              }
                graphRef.current.addEdge(edge, { name: 'add-asset' });
            });
          }
        }
      } catch (error) {
        console.log(error);
        message.error('Could not download graph nodes');
      }
    }

    setConfigDialog({ ...defaultState }); // RESETS LOCAL STATE AND CLOSES DIALOG
    // console.timeEnd('jobFileRelation');
  };

  const updateAsset = (asset) => {
    if (asset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/
      //add icons or statuses
      cell.updateData({ title: asset.title, scheduleType: asset.type, }, { name: 'update-asset' });
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
