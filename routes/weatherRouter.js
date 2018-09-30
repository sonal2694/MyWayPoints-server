const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const weatherApiKey = '16fc319a4c40a6abae9a56af8d5ba50b';

const weatherRouter = express.Router();

weatherRouter.use(bodyParser.json());

weatherRouter.route('/')
.get((req, res, next) => {
    res.end('Will send all the weather to you!');
})
.post((req, res, next) => {
    //res.end('Will add the weather: ' + req.body.name + ' with details: ' + req.body.description);
    let lat = req.body.lat;
    let lon = req.body.lon;
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;
    request(url, (err, response, body) => {
        if(err){
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({"weather": null, "error": 'Error, please try again'});
        }
        else {
            let weather = JSON.parse(body);
            if(weather.main == undefined) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.json({"weather": null, "error": 'Error, please try again blaaa'});
            }
            else {
                let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
                //res.render('index', {weather: weatherText, error: null});
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({"weather": weatherText, "error": null});
            }
        }
    });
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /weather');
})
.delete((req, res, next) => {
    res.end('Deleting all weather');
});

module.exports = weatherRouter;