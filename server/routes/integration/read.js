const express = require('express');
const router = express.Router();
const assert = require('assert');

const dbUtil = require('../../utils/db');
const mongoClient = require('mongodb').MongoClient;

router.get('/integration_list', (req, res) => {
    console.log("[integration/read.js] - Get file list for app_id = " + req.query.app_id);

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);

        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('integration');

        collection.find({"application_id":req.query.app_id}).toArray(function (err, docs) {
            assert.equal(err, null);
 
            res.json(docs);
            client.close();
        });
    });

});


router.get('/integration_basic', (req, res) => {
    
    console.log("[integration basic/read.js] - Get integration basic for integration_id = " + req.query.integration_id);

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);
        
        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('integration');

        collection.find({"_id":req.query.integration_id}).toArray(function (err, docs) {
            assert.equal(err, null);
            if (docs.length > 0) {
                res.json(docs[0]);
            } else {
                res.json();
            }
            client.close();
        });
    });

});

router.get('/key_list', (req, res) => {
        
    console.log("[index key list/read.js] - Get index key for index_id = " + req.query.index_id);

    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);
   
        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('index_key');

        collection.find({"index_id":req.query.index_id}).toArray(function (err, docs) {
            assert.equal(err, null);
 
            if (docs.length > 0) {
                res.json(docs[0].key);
            } else {
                res.json();
            }
            client.close();
        });
    });
});

router.get('/payload_list', (req, res) => {
 
    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);

        console.log("[index payload list/read.js] - Get index payload for index_id = " + req.query.index_id);
   
        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('index_payload');

        collection.find({"index_id":req.query.index_id}).toArray(function (err, docs) {
            assert.equal(err, null);
 
            if (docs.length > 0) {
                res.json(docs[0].payload);
            } else {
                res.json();
            }
            client.close();
        });
    });
});

module.exports = router;