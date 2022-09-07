const express = require("express");
const router = express.Router();

const { file: File, job: Job, report: Report } = require("../../models");
const _ = require("lodash");

router.get("/:applicationId", async (req, res) => {
  try {
    const application_id = req.params.applicationId;

    const jobs = await Job.findAll({
      where: { application_id },
      attributes: ["id", "name", "createdAt"],
      order: [['createdAt', 'ASC']],
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
    
    const allFiles = jobs.reduce((acc,job) => {
      if (job.files.length > 0) acc = [...acc, ...job.files];
      return acc;
    },[])

    const report = { updates: {}, changes:[], current:[] };

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
      for (let inputFile of input) {
        // if this file was already updated use it again as a base
        if (report.updates[inputFile.id]?.fileDTO) inputFile = report.updates[inputFile.id].fileDTO;

        const inputFileLayout = inputFile.metaData?.layout;
        if (!inputFileLayout || inputFileLayout.length === 0) continue;
        // loop through each field and find if it matches any field in output files
        for (const inputFilefield of inputFileLayout) {
          const own = inputFilefield?.constraints?.own?.map((el) => ({ ...el, from: inputFile.name }));
          const inherited = inputFilefield?.constraints?.inherited;
          // getting all possible constraints for this field from input file [{id: constraint id, from: inputfilename | inherited file name}]
          const allInputFieldConstraints = [...own, ...inherited];
          // loop through outputfiles and find each field

          for (let outputFile of output) {
            // if this file was already updated use it again as a base
            if (report.updates[outputFile.id]?.fileDTO) outputFile = report.updates[outputFile.id].fileDTO;

            const outputFileLayout = outputFile.metaData?.layout;
            if (!outputFileLayout || outputFileLayout.length === 0) continue;
            // loop through fields and find if any has same name as inputfield name
            for (const outputFilefield of outputFileLayout) {
                // if not same fields, still check if they have any constraints for report;
              if (inputFilefield.name !== outputFilefield.name) {

                const { inherited, own, } = outputFilefield.constraints;
                
                if (inherited.length > 0 || own.length > 0 ) {

                  const existingConstraints = report.updates?.[outputFile.id]?.fields?.[outputFilefield.name];

                  report.updates[outputFile.id] ={
                    ...report.updates[outputFile.id],
                    name: outputFile.name,
                    fields: {
                      ...report.updates?.[outputFile.id]?.fields,
                      [outputFilefield.name] : {
                        ...(existingConstraints || {own , inherited,})
                      }
                    }
                  }
                }
                continue;
              } 
                
              let currentInherited = outputFilefield.constraints.inherited;
              // if inputfiled has no constraints and output field has no constraints than go to next.
              if (currentInherited.length === 0 && allInputFieldConstraints.length === 0) continue;
              
               const summary = { removed: [], added: [] };
               
               // find removed constraints from field
               const upToDateConstraints = currentInherited.filter((inherited) => {

                const removeConstraint= () =>{
                  summary.removed.push(inherited);
                  return false;
                }

                const fromFile = allFiles.find(file => file.name === inherited.from);
                if (!fromFile) return removeConstraint();

                const layout = fromFile.metaData.layout;
                const fromField = layout.find(field => field.name === outputFilefield.name);

                if (!fromField) return removeConstraint();
                if (!fromField.constraints.own.find((constraint) => constraint.id === inherited.id)) return removeConstraint();

                 return true;
               });

               //find added constraints
               summary.added = upToDateConstraints.length === 0 ?
                [...allInputFieldConstraints] :
                 allInputFieldConstraints.filter(inputConstraint => !upToDateConstraints.find((constraint) => constraint.id === inputConstraint.id));
               
              // rewrite outputfiled inherited constraints with unique values from current output and current input field constraints;
              outputFilefield.constraints.inherited = _.uniqWith([...upToDateConstraints, ...allInputFieldConstraints], _.isEqual);
              
              // append new values to report
              const prevAdded = report?.updates?.[outputFile.id]?.fields?.[outputFilefield.name]?.added;
              const prevRemoved = report?.updates?.[outputFile.id]?.fields?.[outputFilefield.name]?.removed;
               
              report.updates[outputFile.id] ={
                ...report.updates[outputFile.id],
                fileDTO : report.updates[outputFile.id]?.fileDTO || outputFile,
                name: outputFile.name,
                fields: {
                  ...report.updates?.[outputFile.id]?.fields,
                  [outputFilefield.name] : {
                    ...outputFilefield.constraints,
                    added : prevAdded ? _.uniqWith([...prevAdded, ...summary.added], _.isEqual) : summary.added,
                    removed : prevRemoved ? _.uniqWith([...prevRemoved, ...summary.removed], _.isEqual) : summary.removed,
                  }
                }
              }
            }
          }
        }
      }
    }

      for (const id in report.updates) {
        let fileHasFieldsChanges = false;
        let fileHasFieldsConstaints = false;

        const { name: fileName, fields } = report.updates[id];

        const fileDTO = report.updates[id].fileDTO;
        
        const {changes, current } = Object.entries(fields).reduce((acc, [fieldName,values] )=> {
          const field = { name: fieldName, ...values };
          
          const fieldHasChanges = field.added?.length || field.removed?.length;
          const fieldHasConstraints =  field.own?.length || field.inherited?.length;

          if (fieldHasChanges) {
            const {name, added, removed} =field;
            acc.changes.push({name, added, removed});
            fileHasFieldsChanges = true 
          }

          if (fieldHasConstraints) {
            const {name, own, inherited} =field;
            acc.current.push({name, own, inherited});
            fileHasFieldsConstaints = true 
          }


          return acc;
        }, {changes:[], current:[]});

        // if File was not touched we will remove it from update list;
        if (fileHasFieldsChanges && fileDTO) {
          const newMetadata = fileDTO.toJSON().metaData;
          await File.update({ metaData: newMetadata }, { where: { id } });
        }

        if (fileHasFieldsChanges) report.changes.push({ id, name: fileName, fields: changes });
        if (fileHasFieldsConstaints) report.current.push({ id, name: fileName, fields: current });
      }    

       const newReport = await Report.create({ report: report.changes, type:'changes', application_id })
    // OLD WAY -> adding two reports while generating 'changes' report
    // const newReports = await Report.bulkCreate([{ report: report.changes, type:'changes', application_id }, { report: report.current, type:'current', application_id }]);
    // for testing purposes, sleep function;
    // await new Promise(r => setTimeout(r,3000));
    res.send(newReport);
  } catch (error) {
    console.log("-PROPAGATE ERROR-----------------------------------------");
    console.dir({ error }, { depth: null });
    console.log("------------------------------------------");
    res.status(500).send("Error occurred while retreiving credentials");
  }
});

module.exports = router;
