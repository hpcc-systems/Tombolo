import React, { useCallback, useState } from 'react';
import { useEffect, useRef } from 'react';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import '@antv/x6-react-shape';
import { message } from 'antd';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';
import './GraphX6.css'

import Event from './Event';
import Canvas from './Canvas';
import Stencil from './Stencil';
// import Keyboard from './Keyboard';
import CustomToolbar from './Toolbar/Toolbar';

import AssetDetailsDialog from '../AssetDetailsDialog';
import ExistingAssetListDialog from '../Dataflow/ExistingAssetListDialog';
// import SubProcessDialog from '../Dataflow/SubProcessDialog';

const defaultState = {
  openDialog: false,
  subProcessId: '',
  assetId: '',
  title: '',
  name: '',
  type: '',
  nodeId: '',
  cell: null,
  nodes: [], // needed for scheduling 
  edges: [], // ?? not sure if needed
};

function GraphX6({readOnly = false, statuses}) {
  const graphRef = useRef();
  const miniMapContainer = useRef()
  const graphContainerRef = useRef();
  const stencilContainerRef = useRef();
  
  const [graphReady, setGraphReady] = useState(false);
  const [sync, setSync] = useState({ error:"", loading:false  });
  const [configDialog, setConfigDialog] = useState({ ...defaultState });

  const { applicationId, dataflowId, clusterId } = useSelector((state) => state.dataflowReducer);

  useEffect(() => {
    const graph = Canvas.init(graphContainerRef.current, miniMapContainer.current);
    graphRef.current = graph;

    if (!readOnly) {
      Stencil.init(stencilContainerRef.current, graph);
      Event.init(graph); // some static event that does not require local state changes will be sitting here
      if (readOnly) graph.disableHistory() // we dont need to save anything to db so when we readonly
    }
    // Keyboard.init(graph); // not ready yet

    // FETCH SAVED GRAPH
    (async () => {
      try {
        const response = await fetch(
          `/api/dataflowgraph?application_id=${applicationId}&dataflowId=${dataflowId}`,
          { headers: authHeader() }
        );
        if (!response.ok) handleError(response);
        const data = await response.json();
        // if (data){
        //   console.time("graph")
        //   graph.fromJSON(data);
        //   console.log('------------------------------------------');
        //   console.timeEnd("graph")
        //   console.log('------------------------------------------');

        // }
        if (data) {
          console.time("graph")

          // Nodes and Edges comes as a string, need to parse it to object
          const nodes = data.nodes || [];
          const edges = data.edges || [];

          nodes.forEach((node) => {
            const nodeSettings ={
              id: node.id,
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
              shape: 'custom-shape',
              visible: node.visible,
              zIndex:999,
              data: {
                type: node.type,
                name: node.name,
                title: node.title,
                assetId: node.assetId,
                jobType: node.jobType,
                scheduleType: node.scheduleType,
                subProcessId: node.subProcessId,
              },
            };
     
            graph.addNode(nodeSettings);
          });

          edges.forEach((edge) => {
            const edgeSetting={
              source: edge.source, 
              target: edge.target, 
              zIndex:-1,
              attrs: {
                line: edge.line
              },
            }

           graph.addEdge(edgeSetting);
          });
          console.log('------------------------------------------');
          console.timeEnd("graph")
          console.log('------------------------------------------');
        }
      } catch (error) {
        console.log(error);
        message.error('Could not download graph nodes');
      }

    graph.on('node:dblclick', ({ node, cell }) => {
      const nodeData = cell.getData();
      // prevent readonly users to open ExistingAssetListDialog modal 
      if (readOnly && !nodeData.assetId) return; 
      
      setConfigDialog(() => ({
        ...nodeData,
        cell,
        nodeId: node.id,
        openDialog: true,
        edges : graph.getEdges(), // ?? not used anywhere currently
        nodes: graph.getNodes().reduce((acc,el) =>{ // we dont need Nodes full object but just what is inside node.data
          const nodeData = el.getData();
          if (nodeData.assetId){
            acc.push(nodeData)
          }
          return acc
        },[]) 
      }));
    });

    if (!readOnly) {  // restrict readonly users to save changes to DB
      graph.on('node:removed', async ({ cell }) => {
      const nodeData = cell.getData();
      // console.log('node:removed')
      try {
        /* deleting asset from dataflow is multi step operation
        1. delete asset from Asset_Dataflow table
        2. make sure that any Job scheduled with this asset is deleted too
        3. update graph in Dataflowgraph table */
        if (nodeData.assetId) {
          const options = {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ assetId: nodeData.assetId, type: nodeData.type.toLowerCase(), name: nodeData.name, dataflowId }),
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

    graph.on('node:moved', async ({cell,options}) => { 
      // console.log('node:moved')
      await handleSave(graph);
    });

    graph.on('node:added',async ({ node, index, options }) => {
      console.log('node:added')
      await handleSave(graph);
    })

    graph.on('node:change:data', async ({ node, options }) => {
      // ignoring hover events and not saving to db when in readOnly mode
      if (options.ignoreEvent || readOnly) return;

      if (options.name === 'update-asset'){
      // console.log("node:change:data")
        await handleSave(graph);
      }
    })

    graph.on('node:change:visible', async ({ node, options }) => {
      if (options.name === 'update-asset'){
        // console.log("node:change:visible")
        await handleSave(graph);
      }
    })

    // EDGE REMOVE TRIGGERS 'remove' event, and same event is triggered when nodes getting removed. because node removal is multistep operation, we need to have separate listeners for both
    graph.on('edge:added', async ({ edge, index, options }) => { 
      await handleSave(graph);
    })

    graph.on('edge:removed', async () => {
      console.log("edge:removed")
      await handleSave(graph);
    });
    
    graph.on('edge:connected', async (params) => {
        console.log("edge:connected")
        await handleSave(graph);
    })

  }
    
    // !! graph.history.on('change' stop firing when nodes moved a lot, switched to multiple event listeners, bug reported. https://github.com/antvis/X6/issues/1828
    // graph.history.on('change', async ({ cmds, options }) => { 
    //   if (cmds[0].event === 'cell:change:tools' || readOnly) return; // ignoring hover events and not saving to db when in readOnly mode
    //   const actions = ['dnd', 'mouse', 'add-edge', 'add-asset', 'update-asset'];
    //   if (actions.includes(options?.name)) {
    //     await handleSave(graph);
    //   }
    // });

    setGraphReady(true)
    //  will scale graph to fit in to a viewport, will add bottom padding for read only views as they have a table too
    graph.zoomToFit({maxScale:1 , padding: 20}); 
    })();

  }, []);

  useEffect(()=>{
    if( graphReady && readOnly === true &&  statuses?.length > 0 ){
      let jobs =graphRef.current.getNodes().filter(node => node.data.type === 'Job');
      jobs.forEach(node =>{
        const nodeStatus = statuses.find(status => status.assetId === node.data.assetId);
        if (nodeStatus){
          node.updateData({ status: nodeStatus.status });
        } else{
          node.updateData({ status: 'not-exist' }); // change status to '' if you want to return regular node
        }
      })
    }
  },[statuses, readOnly, graphReady])

  const handleSave = useCallback(  
    debounce(async (graph) => {
      console.time('save')
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
        visible: node.visible,
        ...nodeData,
      };
    });
  
    const edges = graph.getEdges().map((edge) => ({
      source: edge.getSourceCellId(),
      target: edge.getTargetCellId(),
      line: edge.getAttrByPath('line')
    }));
      // const graphToJson = graph.toJSON({ diff: true })
      // console.log('-graphToJson-----------------------------------------');
      // console.dir({graphToJson}, { depth: null });
      // console.log('------------------------------------------');
      
    try {
      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ nodes:nodes, edges:edges, application_id: applicationId, dataflowId }),
      };

      const response = await fetch('/api/dataflowgraph/save', options);
      if (!response.ok) handleError(response);
      console.log('------------------------------------------');
      console.timeEnd('save')
      console.log('------------------------------------------');


      console.log('Graph saved');
    } catch (error) {
      console.log(error);
      message.error('Could not save graph');
    }
  }, 500)
    ,[]);


  const saveNewAsset = async (newAsset) => {
    // console.time('jobFileRelation');
    if (newAsset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/
      cell.updateData({
          name: newAsset.name,
          title: newAsset.title,
          assetId: newAsset.id,
          jobType: newAsset.jobType,
          subProcessId: newAsset.jobType === 'Sub-Process' ? newAsset.id : undefined,
        }, { name: 'update-asset' }
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
            addRelatedFiles(realtedFiles, cell)
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

  const addRelatedFiles = ( relatedFiles, cell ) =>{
     // 1. get all files,
     const allFiles = graphRef.current.getNodes().filter(node => node.data.type === 'File' );

     const nodePositions = cell.getProp('position'); // {x,y} of node on a graph
     const yOffset = 70;
     const xOffset = 140;
     // input and output files comes mixed in one array, we will keep track how many output and input files by counting them so we can add proper distance between them;
     const yAxis ={
       input:0,
       output:0
     };
     
     relatedFiles.forEach((relatedFile) => {
      // 2. find existing files on graph and add edge to point to them
      const fileExistsOnGraph = allFiles.find((file) => file.data.assetId === relatedFile.assetId);
      let newNode;
    
      if (!fileExistsOnGraph) {
        // 3. create file nodes, place input file on top and output below job node.
        relatedFile.file_type === 'input' ? (yAxis.input += 1) : (yAxis.output += 1); // calculate how many input and output files to give them proper positioning
    
        const newNodeIndex = relatedFile.file_type === 'input' ? yAxis.input - 1 : yAxis.output - 1;
        const newNodeX = relatedFile.file_type === 'input' ? nodePositions.x - xOffset : nodePositions.x + xOffset;
        const newNodeY = nodePositions.y + yOffset * newNodeIndex;
    
        newNode = graphRef.current.addNode({
          x: newNodeX,
          y: newNodeY,
          shape: 'custom-shape',
          data: {
            type: 'File',
            name: relatedFile.name,
            title: relatedFile.title,
            assetId: relatedFile.assetId,
            subProcessId: undefined,
          },
        });
    
        allFiles.push(newNode); // adding to allFiles to avoid creating new File node
      }

      const relateFileNode = fileExistsOnGraph ? fileExistsOnGraph : newNode;

      const edges = graphRef.current.getConnectedEdges(relateFileNode);
      // if we have edged associated with this file it means that they were just created now while syncing, loop through them and find out if they related to this Job,
      // if edge between job and file already exists, that means that this file if Input and Output at same time, update edge marker to have two arrows green and red
      let edgeUpdated = false;

      if (edges.length > 0) {
        edges.forEach((edge) => {
          if (edge.getTargetCellId() === cell.id || edge.getSourceCellId() === cell.id) {
            edge.attr({
              line: {
                sourceMarker: { fill: '#e69495', stroke: '#e69495', name: 'block' },
                targetMarker: { fill: '#b3eb97', stroke: '#b3eb97', name: 'block' },
                stroke: {
                  type: 'linearGradient',
                  stops: [
                    { offset: '0%', color: '#e69495' },
                    { offset: '50%', color: '#ccc' },
                    { offset: '100%', color: '#b3eb97' },
                  ],
                },
              },
            });
            edgeUpdated = true // if we successfully updated edge we will not need to create additional edges anymore
          }
        });
      } 
      
      if (!edgeUpdated) {
        const edge = {
          target: relatedFile.file_type === 'output' ? relateFileNode : cell,
          source: relatedFile.file_type === 'output' ? cell : relateFileNode,
          zIndex: -1,
          attrs: {
            line: {
              stroke: relatedFile.file_type === 'output' ? '#b3eb97' : '#e69495', // green for output, red for input
            },
          },
        };
      
        graphRef.current.addEdge(edge, { name: 'add-asset' });
      }
    });
  }

  const updateAsset = (asset) => {
    if (asset) {
      const cell = configDialog.cell;
      /* updating cell will cause a POST request to '/api/dataflowgraph/save with latest nodes and edges*/
      //add icons or statuses
      cell.updateData({ title: asset.title, scheduleType: asset.type, }, { name: 'update-asset' });
    }
    setConfigDialog({ ...defaultState }); // RESETS LOCAL STATE AND CLOSES DIALOG
  };

  const handleSync = async () =>{
    const graphJSON=  graphRef.current.toJSON({diff:true});
    console.log('-graphJSON-----------------------------------------');
    console.dir({graphJSON}, { depth: null });
    console.log('------------------------------------------');
    
    try {
      setSync(()=>({ loading: true, error:"" }))
      const cellsJSON = graphJSON.cells.reduce((acc, cell)=>{
        if (cell.shape === 'edge'){
          acc.edges.push(cell);
        } else{
          // Add only Job that can produce files, ignore Manual Jobs
          if (cell.data.type === 'Job' && cell.data.jobType !== "Manual" && cell.data.assetId){
            acc.jobsToServer.push({id:cell.data.assetId, name: cell.data.name});
            acc.jobs.push(cell)
          }
          if (cell.data.type === 'File' && cell.data.assetId){
            acc.files.push(cell);
          }
        }
        return acc
      },{ jobs:[], files:[], edges:[], jobsToServer:[] })

      const options = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          applicationId: applicationId,
          dataflowId: dataflowId,
          clusterId:clusterId,
          jobList: cellsJSON.jobsToServer
        })
      }

      const response = await fetch('/api/job/syncDataflow', options)
      if (!response.ok) handleError(response)
      
      const data = await response.json();

      const result = data.result// array of {job:<assetId>, relatedFiles:{...}}
      const assetsIds = data.assetsIds // array of strings of all assetIds created or modified on backend
    
      const {files, jobs, edges} = cellsJSON;
      
      console.log('-data-----------------------------------------');
      console.dir({data,  files,  jobs, edges}, { depth: null });
      console.log('------------------------------------------');

      if (result?.length > 0){
        result.forEach(el =>{
          if (el.relatedFiles.length > 0){
            const cellJSON = jobs.find(existingJob => {
              return existingJob.data.assetId === el.job
            });
            const cell = graphRef.current.getCellById(cellJSON.id);
            // REMOVE FILE THAT DOES NOT PARTICIPATE ANYMORE AND ALL EDGES, RECREATE EDGES IN addRelatedFiles();
            const incomingEdges = graphRef.current.getIncomingEdges(cell); // Job Input Files
            const outgoingEdges = graphRef.current.getOutgoingEdges(cell) // Job Output Files

            if (incomingEdges) {
              incomingEdges.forEach(edge =>{
                const source = edge.getSourceNode();
                if (source) {
                  const isFile = source.data.type === 'File'
                  if (isFile){
                    const fileExist = assetsIds.includes(source.data.assetId); // assetsIds is array of all assets in this dataflow
                    if(!fileExist){
                      source.remove() // Delete a File from graph because after syncing we found that it is no used in any job in this dataflow
                    }else{
                      graphRef.current.removeEdge(edge); // 
                    }
                  }
                }
              })
            }

            if (outgoingEdges) {
              outgoingEdges.forEach(edge =>{
                const target = edge.getTargetNode();
                if (target) {
                  const isFile = target.data.type === 'File';
                  if (isFile){
                    const fileExist = assetsIds.includes(target.data.assetId);
                    if(!fileExist){
                      target.remove()
                    }else{
                      graphRef.current.removeEdge(edge);
                    }
                  }
                }
              })
            }

            // ADD NEW EDGES
            addRelatedFiles(el.relatedFiles, cell)
          }
        })
      }
      
      setSync(prev=>({...prev, loading: false}))
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({error}, { depth: null });
      console.log('------------------------------------------');
      
      setSync(prev=>({...prev, error: error.message, loading: false}))
      message.error('Could not synchronize graph ');
    }
  }

  return (
    <>
     {readOnly ? null :
      <CustomToolbar graphRef={graphRef} handleSync={handleSync} isSyncing={sync.loading} />
     }
      <div id="graphx6" className='graph-container'>
        {readOnly ? null : <div className='stencil' ref={stencilContainerRef} /> }
        <div className={`${readOnly ? 'graph-container-readonly' : 'graph-container-stencil'}`} ref={graphContainerRef} />
        <div className="graph-minimap" ref={miniMapContainer} />
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
          viewMode={readOnly} // THIS PROP WILL REMOVE EDIT OPTIONS FROM MODAL
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
          clusterId={clusterId}
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
