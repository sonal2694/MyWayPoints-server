// Replace YOUR_API_KEY with the actual Google API key.
// Used for reverse geocoding in this file
var googleMapsClient = require('@google/maps').createClient({
    key: 'API_KEY',
    Promise: Promise
});

var getCity = function(lat, lon) {

	return new Promise(function(resolve, reject) {

		latlon = lat+","+lon;
		//API call
		googleMapsClient.reverseGeocode({latlng: latlon})
		.asPromise()
		.then((response) => {
			var addCompLength = response.json.results[0].address_components.length;
			for(var i = 0; i < addCompLength; i++) {
				var type = response.json.results[0].address_components[i].types[0];
				if(type == "locality")
				{
					city = response.json.results[0].address_components[i].long_name;
					console.log('ReverseGeocode: ' + city);
					resolve(city);
				}
			}
			reject('ReverseGeocode: Unable to find city')
		})
		.catch((err) => {
			console.log(err);
			reject('ReverseGeocode: ' + err)
		});
	});
};

module.exports = {
	getCity: getCity
};