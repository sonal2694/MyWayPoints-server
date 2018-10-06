// The weather.js file contains the functions to get weather either from 
// the cache or by making an API call.

const request = require('request-promise');
const weatherApiKey = '16fc319a4c40a6abae9a56af8d5ba50b';
const reverseGeocode = require('./reverseGeocode');
const validateCache = require('./validateCache');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const mongourl = 'mongodb://localhost:27017/myWayPoints';
const dbname = 'myWayPoints';


// function to check the database for cached weather of a city and retrieve
//the weather object, if present
var getWeatherInfoFromCache = function(cityName) {

	return new Promise(function(resolve, reject) {
		//Connecting to database
		MongoClient.connect(mongourl, function(err, client) {
			assert.equal(null, err);
		   
			const db = client.db(dbname);
			const collection = db.collection('weather');

			// querying database to find one document that matches the cityname
			collection.findOne({
				cityName: cityName
			}, function(err, record) {

				if (err) { 
					reject('getWeatherFromCache failed: '+err);	
				}

				if (record != null) {

					// // validates that the weather obtained is recent and returns the weather object
					// // if the weather is old, sends a message saying "Cache Stale"
					if (validateCache.validate(record)) {
						console.log("Cahe Hit!: " + record.cityName);
						resolve(record.weatherObj);
					} else {
						console.log("Cache Stale! Weather");
						reject('getWeatherFromCache failed: ' + cityName);
					}
				}
				reject('getWeatherFromCache failed: ' + cityName);
	
			});
			client.close();
		});
	});
};

// function to update weather info in database with new upcoming weather requests
var updateWeatherInfoCache = function(cityName, weatherObj) {

	return new Promise(function(resolve, reject) {
		MongoClient.connect(mongourl, function(err, client) {
			assert.equal(null, err);
		
			const db = client.db(dbname);
			const collection = db.collection('weather');

			let doc = {};
			doc['cityName'] = cityName;
			doc['weatherObj'] = weatherObj;
			doc['updatedAt'] = Date.now();
		
			collection.update({
				cityName: cityName
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
};


//function to get weather from API if not present in cache
var getWeatherInfoFromApi = function(lat, lon) {

	return new Promise(function(resolve, reject) {
		//API call for getting the weather
		let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;
		request(url)
		.then((body) => {
			let weather = JSON.parse(body);
			if(weather.main == undefined) {
				console.log("Error, please try again");
				reject('Weather API failed');
			}
			else {
				resolve(weather);
			}
		})
		.catch((err) => {
			console.log(err);
			reject('Weather API failed');
		});
	}); // end of Promise
};

// function to get weather info either from cache or through API call.
var getWeatherInfoForSteps = function(stepsArray) {

    return new Promise(async function(resolve,reject){
    
        var weatherInfoArray = [];
        var alreadyAddedCitySet = new Set();
        var apiCallCount = 0;
		var city;
		
        for (var i = 0; i < stepsArray.length; i++) {
			
			// geocode for the step
			let lat = stepsArray[i].end_location.lat;
			let lon = stepsArray[i].end_location.lng;

            if(stepsArray[i].end_location.hasOwnProperty('city')) {
                city = stepsArray[i].end_location.city;
            }
            //Reverse Geocoding to get CITY.
            else {
				await reverseGeocode
				.getCity(lat, lon)
				.then(function(data) {
					city = data;
				})
				.catch(function(err) {
					reject('- ReverseGeocode failed : ' + err);
				});
			}

			if ( !(alreadyAddedCitySet.has(city)) ) {
				alreadyAddedCitySet.add(city);
				
				getWeatherInfoFromCache(city)
				.then(function(data) {
					apiCallCount ++;
					weatherInfoArray.push(data);
					if(apiCallCount == stepsArray.length) {
						resolve(weatherInfoArray);
					}
				}).catch(function(err) {
					// if weather Object not found in cache or outdated object found, calling API
					console.log('Cahe miss! ' + err);
					getWeatherInfoFromApi(lat, lon)
					.then(function(data) {
						apiCallCount++;
						weatherInfoArray.push(data);
							
						//CACHE WEATHER DATA
						updateWeatherInfoCache(data.name, data)
						.then(function(data) {
							console.log('Cache updated!');
						})
						.catch(function(err) {
							console.log('Cache update failed!' + err);
						});

						// sending weather info back when weather for all steps have been retrieved
						if(apiCallCount == stepsArray.length) {
							resolve(weatherInfoArray);
						}
					})
					.catch(function(err) {
						apiCallCount++;
						console.log('GetWeatherFromAPI failed');
					});
				});		
				
			} else {
				apiCallCount++;
				if(apiCallCount == stepsArray.length) {
					resolve(weatherInfoArray);
				}
			}
        }
    });
};

module.exports = {
	getWeatherInfoForSteps: getWeatherInfoForSteps
};