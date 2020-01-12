const request = require("request");


/**
 * 
 * @param {String} url 
 * @param {(err, res, body) => void} callback 
 */
function req(url, callback) {
  request.get(url, {}, callback);
}

module.exports = req;