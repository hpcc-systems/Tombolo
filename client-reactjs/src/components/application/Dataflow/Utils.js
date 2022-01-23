import * as d3 from "d3";

export const shapesData = [
  { "x": "10", "y": "20", "rx":"10", "ry":"10", "rectx":"10", "recty":"0", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"28", "title":"Job", "color":"#EE7423", "icon":"\uf085", "iconx":"90", "icony":"25", "description":"HPCC Job"},
  //{ "x": "10", "y": "70", "rx":"10", "ry":"10", "rectx":"10", "recty":"70", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"98", "title":"Modeling", "color":"#EE7423", "icon":"\uf00a", "iconx":"90", "icony":"65", "description":"Modeling Job"},
  //{ "x": "10", "y": "120", "rx":"10", "ry":"10", "rectx":"10", "recty":"140", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"168", "title":"Scoring", "color":"#EE7423", "icon":"\uf005 ", "iconx":"90", "icony":"65", "description":"Scoring Job"},
  //{ "x": "10", "y": "170", "rx":"10", "ry":"10", "rectx":"10", "recty":"210", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"238", "title":"ETL", "color":"#EE7423", "icon":"\uf0ae", "iconx":"90", "icony":"65", "description":"ETL Job"},
  //{ "x": "10", "y": "270", "rx":"10", "ry":"10", "rectx":"10", "recty":"350", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"378", "title":"Query Build", "color":"#EE7423", "icon":"\uf002", "iconx":"90", "icony":"65", "description":"Query Build Job"},
  //{ "x": "10", "y": "220", "rx":"10", "ry":"10", "rectx":"10", "recty":"280", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"308", "title":"Data Profile", "color":"#EE7423", "icon":"\uf0e3", "iconx":"90", "icony":"65", "description":"Data Profile"},
  { "x": "10", "y": "70", "rx":"10", "ry":"10", "rectx":"10", "recty":"70", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"98", "title":"File", "color":"#7AAAD0", "icon":"\uf1c0", "iconx":"90", "icony":"65", "description":"File definition"},
  //{ "x": "10", "y": "320", "rx":"10", "ry":"10", "rectx":"10", "recty":"420", "rectwidth":"35", "rectheight":"35", "tx":"15", "ty":"445", "title":"File Instance", "color":"#7AAAD0", "icon":"\uf0c5", "iconx":"70", "icony":"65", "description":"An Instance of a File Definition"},
  //{ "x": "10", "y": "120", "rx":"10", "ry":"10", "rectx":"10", "recty":"170", "rectwidth":"55", "rectheight":"55", "tx":"20", "ty":"210", "title":"Query", "color":"#9B6A97", "icon":"\uf00e", "iconx":"90", "icony":"65"},
  { "x": "10", "y": "120", "rx":"10", "ry":"10", "rectx":"10", "recty":"140", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"168", "title":"Index", "color":"#7DC470", "icon":"\uf2b9", "iconx":"90", "icony":"65", "description":"Index"},
  { "x": "10", "y": "170", "rx":"10", "ry":"10", "rectx":"10", "recty":"210", "rectwidth":"38", "rectheight":"38", "tx":"15", "ty":"238", "title":"Sub-Process", "color":"#F5A9A9", "icon":"\uf074", "iconx":"90", "icony":"65", "description":"Sub-Process / Dataflow. "},
];

export const jobIcons = {
  "Job": "\uf085",
  "Modeling": "\uf00a",
  "Scoring": "\uf005",
  "ETL": "\uf0ae",
  "Query Build": "\uf002",
  "Data Profile": "\uf0e3",
  "Script": "\uf121",
  "Spray": "\uf2cc",
  "Manual" : "\uf0ad"
}

export function appendDefs(svg)  {
 let defs = svg.append('svg:defs');
  defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', "25")
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

  // define arrow markers for leading arrow
  defs.append('svg:marker')
      .attr('id', 'mark-end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 5)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

	let feMerge = defs.append('svg:filter')
	  .attr('id', 'glow')
	  .append('svg:feGaussianBlur')
	  .attr('stdDeviation', '1.0')
	  .attr('result', 'coloredBlur')
	  .append('svg:feMerge')

	  feMerge.append('svg:feMergeNode')
	    .attr('in', 'coloredBlur')

	  feMerge.append('svg:feMergeNode')
	    .attr('in', 'SourceGraphic');
}