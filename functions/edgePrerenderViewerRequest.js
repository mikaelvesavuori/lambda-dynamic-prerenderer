'use strict';

exports.handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	const headers = request.headers;
	const customUserAgentHeaderName = 'x-resolved-user-agent';
	const userAgent = headers['user-agent'][0].value;

	console.log('userAgent', userAgent);

	headers[customUserAgentHeaderName.toLowerCase()] = [
		{
			key: customUserAgentHeaderName,
			value: userAgent
		}
	];

	callback(null, request);
};
