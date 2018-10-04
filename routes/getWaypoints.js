const express = require('express');
const app = express();
const bodyParser = require('body-parser');
//const getWeather = require('./getWeather');
//const Promise = require('bluebird');
const request = require('request-promise');
const weatherApiKey = '16fc319a4c40a6abae9a56af8d5ba50b';
// const Set = require('.collections/set');

var getWaypoints = function(req) {
    return new Promise(function(resolve,reject){
        var stepsArray = req.routes[0].legs[0].steps;
        var weatherInfoArray = [];
        var alreadyAddedCitySet = new Set();
        var apiCallCount = 0;
        for (var i = 0; i < stepsArray.length; i++) {
            let lat = stepsArray[i].end_location.lat;
            let lon = stepsArray[i].end_location.lng;

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
                        console.log(weather.name);
                        alreadyAddedCitySet.add(weather.name);
                        weatherInfoArray.push(weather);
                    }
                    // let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
                    // weatherResponse = {"weather": weatherText, "error": null};
                }
                console.log(weatherResponse);
                if(apiCallCount == stepsArray.length)
                    resolve(weatherInfoArray);
            })
            .catch((err) => {
                console.log(err);
            });
        }
    });
};
module.exports = getWaypoints;