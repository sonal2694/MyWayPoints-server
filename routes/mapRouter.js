const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const mapRouter = express.Router();

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
    //res.end('Will add the weather: ' + req.body.name + ' with details: ' + req.body.description);
    let orig = req.body.origin;
    let dest = req.body.destination;
    googleMapsClient.directions({
        origin: orig,
        destination: dest,
        mode: "driving",
    })
    .asPromise()
    .then((response) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(response.json);
    })
    .catch((err) => {
        console.log(err);
    });
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /map');
})
.delete((req, res, next) => {
    res.end('Deleting all map info');
});

module.exports = mapRouter;