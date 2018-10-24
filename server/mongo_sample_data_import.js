

const dbUtil = require('./utils/db');

const mongoClient = require('mongodb').MongoClient;
const assert = require('assert');
//file
let appListFile = require("./data/app/app_list.json");
let fileListFile = require("./data/file/file_list.json");
let layoutListFile = require("./data/file/layout_list.json");
let validationListFile = require("./data/file/validation_list.json");
let relationListFile = require("./data/file/relation_list.json");
let licenseListFile = require("./data/file/license_list.json"); 
//index
let indexListFile = require("./data/index/index_list.json");
let indexKeyListFile = require("./data/index/key_list.json");
let indexPayloadListFile = require("./data/index/payload_list.json");
//integration
let integrationListFile = require("./data/integration/integration_list.json");

async function importData() {

    const conn = await mongoClient.connect(dbUtil.mongoUrl());    
    const db = await conn.db(dbUtil.mongoDbName());
    //app
    const appCollection = db.collection('application');
    //file
    const fileCollection = db.collection('file');
    const layoutCollection = db.collection('file_layout');
    const validationCollection = db.collection('file_validation');
    const relationCollection = db.collection('file_relation');
    const licenseCollection = db.collection('file_license');
    //index
    const indexCollection = db.collection('index');
    const indexKeyCollection = db.collection('index_key');
    const indexPayloadCollection = db.collection('index_payload');
    //integration
    const integrationCollection = db.collection('integration');
 
 
    await appCollection.deleteMany({});
    await appCollection.insertMany(appListFile);
 
    await fileCollection.deleteMany({});
    await fileCollection.insertMany(fileListFile);
 
    await layoutCollection.deleteMany({});
    await layoutCollection.insertMany(layoutListFile);
 
    await validationCollection.deleteMany({});
    await validationCollection.insertMany(validationListFile);

    await relationCollection.deleteMany({});
    await relationCollection.insertMany(relationListFile);

    await licenseCollection.deleteMany({});
    await licenseCollection.insertMany(licenseListFile);

    await indexCollection.deleteMany({});
    await indexCollection.insertMany(indexListFile);

    await indexKeyCollection.deleteMany({});
    await indexKeyCollection.insertMany(indexKeyListFile);

    await indexPayloadCollection.deleteMany({});
    await indexPayloadCollection.insertMany(indexPayloadListFile);

    await integrationCollection.deleteMany({});
    await integrationCollection.insertMany(integrationListFile);

    conn.close();
   

}

importData();

