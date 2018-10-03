const request = require('request-promise');
const weatherApiKey = '16fc319a4c40a6abae9a56af8d5ba50b';

var getWeather = (weatherCoords) => {
    let lat = weatherCoords.lat;
    let lon = weatherCoords.lon;
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;
    var weatherResponse;
    request(url)
    .then((body) => {
        console.log("ppup");
        let weather = JSON.parse(body);
        if(weather.main == undefined) {
            console.log("Error, please try again blaaa");
            weatherResponse = {"weather": null, "error": 'Error, please try again blaaa.'};
        }
        else {
            let weatherText = `It's ${weather.main.temp} degrees in ${weather.name}!`;
            //res.render('index', {weather: weatherText, error: null});
            weatherResponse = {"weather": weatherText, "error": null};
        }
    })
    .catch((err) => console.log(err));
    return weatherResponse;
}
module.exports = getWeather;