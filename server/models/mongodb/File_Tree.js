let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Anchor = new Schema({
  elementId: String,
  type: String
},{ _id : false });

let Style = new Schema({
  id: String,
  style: String
},{ _id : false });

let Connections = new Schema({
  id: String,
  sourceId: String,
  targetId: String,
  anchors: [Anchor]
},{ _id : false });

let File_Tree = new Schema({
  application_id: String,
  connections: [Connections],
  styles: [Style]
});

module.exports = mongoose.model('File_Tree', File_Tree);
