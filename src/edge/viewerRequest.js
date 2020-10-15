"use strict";

/**
 * @description The first function to fire. This passes the user agent header into the next function.
 */
exports.handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	const headers = request.headers;

	const CUSTOM_UA_HEADER = "x-resolved-user-agent";
	const UA = headers["user-agent"][0].value;

	console.log("user-agent", UA);

	headers[CUSTOM_UA_HEADER.toLowerCase()] = [
		{
			key: CUSTOM_UA_HEADER,
			value: UA,
		},
	];

	callback(null, request);
};
