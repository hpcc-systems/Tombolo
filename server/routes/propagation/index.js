const express = require("express");
const router = express.Router();

const { v4: uuidv4 } = require('uuid')

const { file: File, job: Job } = require("../../models");
const _ = require("lodash");

router.get("/:applicationId", async (req, res) => {
  try {
    const application_id = req.params.applicationId;

    const jobs = await Job.findAll({
      where: { application_id },
      attributes: ["id", "name"],
      include: [
        {
          model: File,
          required: true,
          attributes: ["id", "name", "metaData"],
          through: { attributes: ["file_type"] },
        },
      ],
    });

    // {
    //   "id": "2740ea56-03c9-48ec-832f-59d0fd5458ec",
    //   "name": "TestOutput",
    //   "files": [
    //     {
    //       "id": "e5d7d30e-e903-4240-b241-7194d129abb3",
    //       "name": "hthor::asdf::asdf::fake_people2.csv_thor",
    //       "metaData": {
    //         "layout": [ { "id": 0, "name": "firstname", "type": "String", "eclType": "string11",
    //               "constraints": { "own": [], "inherited": [] }, "description": "" }, ],
    //         "licenses": [],
    //         "constraints": [ "67bd590d-3f2d-4647-b327-3e61fc686ac2", "b945a628-e897-4110-9fbe-ca37e2c465ab" ],
    //         "isAssociated": true
    //       },
    //       "jobfile": { "file_type": "output" }
    //     },
    //     ]
    //   },
    
    const report = {
      updates: {},
      final:[],
      filesToUpdate: [],
    };

    // loop through all jobs and find input and output files;
    for (const job of jobs) {
      const { input, output } = job.files.reduce(
        (acc, file) => {
          if (file?.jobfile?.file_type === "input") acc.input.push(file);
          if (file?.jobfile?.file_type === "output") acc.output.push(file);
          return acc;
        },
        { input: [], output: [] }
      );
      // loop through inputFiles and find each field in it;
      for (const inputFile of input) {
        const inputFileLayout = inputFile.metaData?.layout;
        if (!inputFileLayout || inputFileLayout.length === 0) continue;
        // loop through each field and find if it matches any field in output files
        for (const inputFilefield of inputFileLayout) {
          const own = inputFilefield?.constraints?.own?.map((el) => ({ ...el, from: inputFile.name }));
          const inherited = inputFilefield?.constraints?.inherited;
          // getting all possible constraints for this field from input file [{id: constraint id, from: inputfilename | inherited file name}]
          const allConstraints = [...own, ...inherited];
          // loop through outputfiles and find each field
          for (const outputFile of output) {
            const outputFileLayout = outputFile.metaData?.layout;
            if (!outputFileLayout || outputFileLayout.length === 0) continue;
            // loop through fields and find if any has same name as inputfield name
            for (const outputFilefield of outputFileLayout) {
                // if not same fields, still check if they have any constraints for report;
              if (inputFilefield.name !== outputFilefield.name) {
                const { inherited, own }= outputFilefield.constraints;
                if (inherited.length > 0 || own.length > 0 ) {
                  report.updates[outputFile.name] ={
                    id: outputFile.id,
                    fields: {
                      ...report.updates?.[outputFile.name]?.fields,
                      [outputFilefield.name] : {
                        ...report.updates?.[outputFile.name]?.fields?.[outputFilefield.name],
                        current: { own, inherited },
                      }
                    }
                  }
                }
                continue;
              } 
                
              // if inputfiled has no constraints and output field has no constraints than go to next.
              let currentInherited = outputFilefield.constraints.inherited;
              if (currentInherited.length === 0 && allConstraints.length === 0) continue;

              const removed = [];
              // filter out current outputfiled constraints and find if any were removed from inputfiled
              const upToDateConstraints = currentInherited.filter((inherited) => {
                if (!allConstraints.find((constraint) => constraint.id === inherited.id)) {
                  removed.push(inherited);
                  return false;
                }
                return true;
              });
     
              // rewrite outputfiled inherited constraints with unique values from current output and current input field constraints;
              outputFilefield.constraints.inherited = _.uniqWith([...upToDateConstraints, ...allConstraints], _.isEqual);
              
              // Creating report
              // Keep track of all files Ids that were mutated
              if (!report.filesToUpdate.includes(outputFile.id)) report.filesToUpdate.push(outputFile.id);
              // get short values to update report
              const fileReport = report.updates[outputFile.name];
              const added = upToDateConstraints.length ? _.differenceWith( allConstraints, upToDateConstraints, _.isEqual) : allConstraints;
              // append new values to report, !!!when out of the loop we will remove duplicates and optimize output;
              report.updates[outputFile.name] ={
                id: outputFile.id,
                fields: {
                  ...report.updates?.[outputFile.name]?.fields,
                  [outputFilefield.name] : {
                    added : fileReport?.[outputFilefield.name]?.added ?  [...fileReport?.[outputFilefield.name]?.added, ...added ] : added,
                    removed : fileReport?.[outputFilefield.name]?.removed ?  [...fileReport?.[outputFilefield.name]?.removed, ...removed ] : removed,
                    current: {
                      own: outputFilefield.constraints.own,
                      inherited: outputFilefield.constraints.inherited,
                    },
                  }
                }
              }
            }
          }
        }
      }

      // loop through all keys and update report with deduped values;
      for (const file in report.updates) {
        for (const field in report.updates[file].fields) {
          report.updates[file].fields[field].added = _.uniqWith(report.updates[file].fields[field].added , _.isEqual);
          report.updates[file].fields[field].removed = _.uniqWith(report.updates[file].fields[field].removed , _.isEqual);
          // if no changes was made to file,and file has no own or inherited constraints, remove in from report and from filesToUpdate list;
          const {current, added, removed } = report.updates[file].fields[field];
          const {own, inherited} = current;

          if (!added.length && !removed.length && !own.length && !inherited.length) {
            delete report.updates[file].fields[field];
          } else {
            report.updates[file].hasChanges = true;
          }
        }
        // if no changes was made to file, remove in from report and from filesToUpdate list;
        if (!report.updates[file].hasChanges){
          report.filesToUpdate = report.filesToUpdate.filter(id => id !== report.updates[file].id);
        }else{
          const { id, fields } = report.updates[file];
          const fieldsArr = Object.entries(fields).map(([field,values] )=> {
          let { current, ...rest } = values;
          return {name: field, ...rest, ...current };
          });

          const fileReport = { id, name: file, fields: fieldsArr };

          report.final.push(fileReport);
        }
      }    
      
      // loop through all job files and update the one that has been touched;
      for (const file of job.files) {
        try {
          if (report.filesToUpdate.includes(file.id)) {
            await File.update({ metaData: file.toJSON().metaData }, { where: { id: file.id } });
          }
        } catch (error) {
          console.log("error", error);
        }
      }
    }
    // for testing purposes, sleep function;
    // await new Promise(r => setTimeout(r,3000));

    res.send({ id: uuidv4(), timeStamp: Date.now(), report: report.final });
  } catch (error) {
    console.log("-PROPAGATE ERROR-----------------------------------------");
    console.dir({ error }, { depth: null });
    console.log("------------------------------------------");
    res.status(500).send("Error occurred while retreiving credentials");
  }
});

module.exports = router;
