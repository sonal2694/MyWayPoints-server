// validateCache.js validates a document in the database
//returns true if document is not outdated
//returns false if document has expired a given time
var validate = function(doc) {

	let sensitivity = 120 // in seconds
	sensitivity *= 1000;

	let docLastUpdatedTime = Number(doc.updatedAt);
	let currTime = Date.now();

	if (docLastUpdatedTime + sensitivity < currTime) {
		return false;
	} else {
		return true;
	}
};

module.exports = {
	validate: validate
};