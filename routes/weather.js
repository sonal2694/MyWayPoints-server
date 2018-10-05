const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request-promise');
const weatherApiKey = '16fc319a4c40a6abae9a56af8d5ba50b';

var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyAjj0bNxVgUF6IeSHBXdHLVEgWP9f6OCCs',
    Promise: Promise
});

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const mongourl = 'mongodb://localhost:27017/myWayPoints';
const dbname = 'myWayPoints';

var weather = function(req) {
    return new Promise(function(resolve,reject){
        var stepsArray = req.routes[0].legs[0].steps;
        var weatherInfoArray = [];
        var alreadyAddedCitySet = new Set();
        var apiCallCount = 0;
        var city;
        for (var i = 0; i < stepsArray.length; i++) {
            let lat = stepsArray[i].end_location.lat;
            let lon = stepsArray[i].end_location.lng;

            if(stepsArray[i].end_location.hasOwnProperty('city')) {
                city = stepsArray[i].end_location.city;
                //Code for checking weather in DB
            }

            //Reverse Geocoding to get CITY. 
            else {
                latlon = lat+","+lon;
                googleMapsClient.reverseGeocode({latlng: latlon})
                .asPromise()
                .then((response) => {
                    var addCompLength = response.json.results[0].address_components.length;
                    for(var i = 0; i < addCompLength; i++) {
                        var type = response.json.results[0].address_components[i].types[0];
                        if(type == "locality")
                        {
                            city = response.json.results[0].address_components[i].long_name;
                            console.log(city);
                            //Code for Checking weather is DB
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
            }


            //Getting the weather
            let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;
            //var weatherResponse;
            request(url)
            .then((body) => {
                let weather = JSON.parse(body);
                if(weather.main == undefined) {
                    console.log("Error, please try again blaaa");
                    // weatherResponse = {"weather": null, "error": 'Error, please try again blaaa.'};
                }
                else {
                    apiCallCount ++;
                    if ( !(alreadyAddedCitySet.has(weather.name)) ) {
                        alreadyAddedCitySet.add(weather.name);
                        weatherInfoArray.push(weather);
                        //CACHE WEATHER DATA
                    }

                    //CACHE ROUTES
                }
                //console.log(weatherResponse);
                if(apiCallCount == stepsArray.length)
                    resolve(weatherInfoArray);
                console.log(apiCallCount);
            })
            .catch((err) => {
                console.log(err);
            });
        }
    });
};
module.exports = weather;


// let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
// weatherResponse = {"weather": weatherText, "error": null};