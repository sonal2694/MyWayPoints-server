// The mapRouter.js file contains the code to get routes either from 
// the cache or by making an API call. Requests from the client side are 
// received at the mapRouter.post() end point, subsequently processed
// and an appropriate response is sent back

const express = require('express');
const bodyParser = require('body-parser');
const weather = require('./weather');
const validateCache = require('./validateCache');

const mapRouter = express.Router();

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const mongourl = 'mongodb://localhost:27017/myWayPoints';
const dbname = 'myWayPoints';

// Replace YOUR_API_KEY with the actual Google API key.
// Used to get directions from origin to destination
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
	
	// Calling getRoutesObj() to get the route from "orig" to "dest"
	// Scroll down for function definition 
	getRoutesObj(orig, dest)
	.then(function(routeData){ 
		// routeData is data returned from function getRoutesObj()
		let stepsArray = routeData.routes[0].legs[0].steps;

		// finalResponse is the json object that will be sent back to the client-side.
		// Contains routeObj and weatherObj
		let finalResponse = {};
		finalResponse['routeObj'] = routeData;

		// getWeatherInfoForSteps() gets the weather info of the Waypoints
		weather.getWeatherInfoForSteps(stepsArray)
		.then(function(weatherData) {
			finalResponse['weatherData'] = weatherData;
			// sending the response back to client side.
			res.send(finalResponse); 
		})
		.catch(function(err) {
			console.log('Weather API failed ' + err);
		});
	})
	.catch(function(err) {
		console.log('Failed to get route: ' + err);
	});
}) //end of post
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /map');
})
.delete((req, res, next) => {
    res.end('Deleting all map info');
});

// Function to update the routes database with new or updated requests
var updateRoutesCache = function(source, destination, routesObj) {

	return new Promise(function(resolve, reject) {
		//Connecting to database
		MongoClient.connect(mongourl, function(err, client) {
			assert.equal(null, err);
		
			const db = client.db(dbname);
			const collection = db.collection('routes');

			let doc = {};
			doc['source'] = source;
			doc['destination'] = destination;
			doc['routesObj'] = routesObj;
			doc['updatedAt'] = Date.now();
		
			collection.update({
				source: source,
				destination: destination
			}, doc, {
				upsert: true
			}, function(err, obj) {
				if (err) {
					reject(err);
				}
				resolve();
				client.close();
			});
		});
	}); // end of Promise
}; // end of updateRoutesCache


// Function to get routes from the cached data in database, if present
var getRoutesObjFromCache = function(source, destination) {
	return new Promise(function(resolve, reject) {
		MongoClient.connect(mongourl, (err, client) => {

            // confirms error is null
            assert.equal(err,null);
            
            const db = client.db(dbname);
			const collection = db.collection("routes");

			collection
			.findOne({"source": source, "destination": destination},
            (err, doc) => {

				if (doc != null) {

					// validates that the route obtained is recent and returns the route object
					// if the route is old, sends a message saying "Cache Stale"
					if (validateCache.validate(doc)) {
						console.log("Cache Hit! Route retrieved.");
						resolve(doc.routesObj);
					} else {
						console.log("Cache Stale! Route ");
						reject("Cache Stale! Route ");
					}
				}
				reject('Cache miss! Route');
            });
        });
	});
}

// function to get route from API if route not present in database
var getRoutesObjFromApi = function(source, destination) {
	return new Promise(function(resolve, reject) {
		googleMapsClient.directions({
			origin: source,
			destination: destination,
			mode: "driving",
		})
		.asPromise()
		.then((response) => {
			resolve(response.json);
		})
		.catch((err) => {
			reject(err);
		});
	});
}


// function to get route info either from cache or through API call.
var getRoutesObj = function(source, destination) {
    return new Promise(function(resolve, reject){

		//check cache for route
		getRoutesObjFromCache(source, destination)
		.then(function(routesObj) {
			resolve(routesObj); // return, if route found
		})
		// if route not present in cache
		.catch(function(err) {

			getRoutesObjFromApi(source, destination)
			.then(function(routesObj) {

				// adding route to cache after getting it from the API call
				updateRoutesCache(source, destination, routesObj)
				.then(function(){
					console.log('Route cached');
					resolve(routesObj);
				})
				.catch(function(err) {
					console.log('Route caching failed');
					resolve(routesObj);
				});
			})
			.catch(function(err) {
				console.log('Unable to fetch route!');
				reject();
			});
		});
    });
};

module.exports = mapRouter;