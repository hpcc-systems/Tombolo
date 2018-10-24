const express = require('express');
const router = express.Router();
const assert = require('assert');

const dbUtil = require('../../utils/db');
const mongoClient = require('mongodb').MongoClient;

router.get('/file_list', (req, res) => {
    console.log("[file list/read.js] - Get file list for app_id = " + req.query.app_id);

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);

        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('file');

        collection.find({"application_id":req.query.app_id}).toArray(function (err, docs) {
            assert.equal(err, null);
 
            res.json(docs);
            client.close();
        });
    });

});


router.get('/file_basic', (req, res) => {
    
    console.log("[file basic/read.js] - Get file basic for app_id = " + req.query.app_id);

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);
        
        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('file');

        collection.find({"_id":req.query.file_id}).toArray(function (err, docs) {
            assert.equal(err, null);
            if (docs.length > 0) {
                res.json(docs[0]);
            }
            client.close();
        });
    });

});

router.get('/layout_list', (req, res) => {
    console.log("[layout list/read.js] - Get file basic for app_id = " + req.query.app_id);

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);

        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('file_layout');

        collection.find({"file_id":req.query.file_id}).toArray(function (err, docs) {
            assert.equal(err, null);

            if (docs.length > 0) {
                res.json(docs[0].layout);
            } else {
                res.json();
            }
            client.close();
        });
    });
});

router.get('/validation_list', (req, res) => {
 
    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);
   
        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('file_validation');

        collection.find({"file_id":req.query.file_id}).toArray(function (err, docs) {
            assert.equal(err, null);
 
            if (docs.length > 0) {
                res.json(docs[0].validation);
            } else {
                res.json();
            }
            client.close();
        });
    });
});

router.get('/relations_list', (req, res) => {
  
    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);
 
        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('file_relation');

        collection.find({"destinationFileId":req.query.file_id}).toArray(function (err, docs) {
            assert.equal(err, null);
            res.json(docs);
            client.close();
        });
    });
});


router.get('/license_list', (req, res) => {

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);

        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('file_license');

        collection.find({"file_id":req.query.file_id}).toArray(function (err, docs) {
            assert.equal(err, null);
            console.log("Found the following license records");
            if (docs.length >0) {
                console.log(docs[0].purpose);
                res.json(docs[0].purpose);
            } else {
                res.json();
            }
            client.close();
        });
    });
});


module.exports = router;