"use strict";

/**
 * @description The fourth function to fire. Sets CORS policy for response.
 */
exports.handler = (event, context, callback) => {
	console.log("event", JSON.stringify(event));
	const response = event.Records[0].cf.response;

	if ("origin" in event.Records[0].cf.request.headers) {
		console.log("headers", "request has origin header");

		try {
			response.headers["access-control-allow-origin"] = [
				{
					key: "Access-Control-Allow-Origin",
					value: "*",
				},
			];
			response.headers["access-control-allow-methods"] = [
				{
					key: "Access-Control-Allow-Methods",
					value: "GET, POST, OPTIONS, HEAD",
				},
			];
		} catch (err) {
			console.log("headers", {
				error: { message: err.message, stack: err.stack },
			});
		}
	}

	console.log("response", JSON.stringify(response, null, 2));
	callback(null, response);
};
