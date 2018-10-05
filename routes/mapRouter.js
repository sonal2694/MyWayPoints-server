const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const weather = require('./weather');

const mapRouter = express.Router();

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const mongourl = 'mongodb://localhost:27017/myWayPoints';
const dbname = 'myWayPoints';

var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyAjj0bNxVgUF6IeSHBXdHLVEgWP9f6OCCs',
    Promise: Promise
});

mapRouter.use(bodyParser.json());


mapRouter.route('/')
.get((req, res, next) => {
    res.end('GET operation not supported on /map');
})
.post((req, res, next) => {
    
    let orig = req.body.origin;
    let dest = req.body.destination;


    MongoClient.connect(mongourl, (err, client) => {

        assert.equal(err,null);
        console.log('Connected correctly to server');
        const db = client.db(dbname);
        const collection = db.collection("routes");
        collection.findOne({"origin": orig, "destination": dest},
        (err, doc) => {

            assert.equal(err,null);
            //if route exists in DB
            if (doc != null) {
                console.log("Found:\n");
                console.log(doc);
                weather(response.json)
                .then((weatherArray) => {

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    resp = {
                        "directions" : response.json,
                        "weatherData": weatherArray
                    }
                    res.json(resp);
                    client.close();
                })
                .catch((err) => {
                    console.log(err);
                });
            } // end of if

            //if route does not exist in DB
            else {
                //Using GoogleMap API to get route
                googleMapsClient.directions({
                    origin: orig,
                    destination: dest,
                    mode: "driving",
                })
                .asPromise()
                .then((response) => {
                    weather(response.json)
                    .then((weatherArray) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        resp = {
                            "directions" : response.json,
                            "weatherData": weatherArray
                        }
                        res.json(resp);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
            } // end of else
        }); // end of findOne
    }); //end of connect()
}) //end of post
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /map');
})
.delete((req, res, next) => {
    res.end('Deleting all map info');
});

module.exports = mapRouter;