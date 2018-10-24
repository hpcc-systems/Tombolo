const express = require('express');
const router = express.Router();
const assert = require('assert');

const dbUtil = require('../../utils/db');
const mongoClient = require('mongodb').MongoClient;


router.get('/app_list', (req, res) => {    
    console.log("[app/read.js] - App route called");
   
    mongoClient.connect(dbUtil.mongoUrl(), function(err, client) {
        assert.equal(null, err);

        const db = client.db(dbUtil.mongoDbName());

        const collection = db.collection('application');

        collection.find().toArray(function (err, docs) {
            assert.equal(err, null);

            res.json(docs);
            client.close();
        });
    });
});

module.exports = router;