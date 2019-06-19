const express = require('express');
let mongoose = require('mongoose');
var models  = require('../../models');
let FileLayout = models.file_layout;
let File = models.file;
let App = models.application;
var fs = require('fs');
var path = require('path');

module.exports = {
    getECLSchema,
    getJSONSchema
};

async function getECLSchema(appId, res) {
  var results = [], ds = '\tEXPORT DATASETS  := MODULE\n';
  var schema = 'EXPORT files := MODULE\n\n\t EXPORT layouts := MODULE\n\n';
      try {
          var app = await App.findOne({where:{"id":appId}});
          var schemaFile = path.join(__dirname, '..', '..', 'schemas', app.title+'-schema.ecl');
          var files = await File.findAll({where:{"application_id":appId}});
          for(const file of files) {
              var fileLayout = await FileLayout.findAll({where:{"application_id":appId, "file_id":file.id}});
              var fileId = file.title.replace('-', '_');
              schema += '\n\t\tEXPORT ' + fileId + ' := RECORD\n';
              for(const field of fileLayout) {
                schema += '\t\t\t' + field.type + ' ' + field.name + ';\n';
              }
              schema += '\t\tEND;\n\n'

              ds+='\t\tEXPORT ' + fileId + ' := DATASET(\'~'+fileId+'\', layouts.'+fileId+',THOR);\n';
              //schema += '\tEND;'

          }

          schema += '\n'+ ds + '\tEND;\n\nEND;';
          console.log('schem-23: '+schema);

          fs.appendFile(schemaFile, schema, function (err) {
              if (err) throw err;
              console.log('Saved! ');
              res.download(schemaFile, function(err){
                if (err) {
                  console.log("Error occured during download...")
                } else {
                  console.log("Download completed...")
                  fs.unlink(schemaFile, (err) => {
                    if (err) throw err;
                    console.log(schemaFile + ' was deleted after download');
                  });
                }
              });
          });
      } catch (err) {
          console.log('err', err);
      }
}

async function getJSONSchema(appId, res) {
  try {
        var schemaFile = path.join(__dirname, '..', '..', 'schemas', appId+'-schema.json');
        console.log('appId: '+appId);
        var result=[];

        var files = await File.findAll({where:{"application_id":appId}});
        for(const file of files) {
          var fileObj={};
          var fileId = file.title.replace('-', '_');
          fileObj.file_id=file.title;
          var fileLayout = await FileLayout.findAll({where:{"application_id":appId, "file_id":file.id}});
          var layouts = [];
          for(const layout of fileLayout) {
            layoutObj = {};
            layoutObj.name = layout.name;
            layoutObj.type = layout.type;
            layoutObj.displayType = layout.displayType;
            layoutObj.displaySize = layout.displaySize;
            layoutObj.textJustification = layout.textJustification;
            layoutObj.format = layout.format;
            layoutObj.isSPII = layout.isSPII;
            layoutObj.isPII = layout.isPII;

            layouts.push(layoutObj);
          }
          fileObj.layout = layouts;

          result.push(fileObj)

        }
        schema = JSON.stringify(result, null, 4);

        fs.appendFile(schemaFile, schema, function (err) {
          if (err) throw err;
          console.log('Saved! ');
          res.download(schemaFile, function(err){
              if (err) {
                console.log("Error occured during download...")
              } else {
                console.log("Download completed...")
                fs.unlink(schemaFile, (err) => {
                  if (err) throw err;
                  console.log(schemaFile + ' was deleted after download');
                });
              }
              });
        })
    } catch (err) {
        console.log('err', err);
      }
}