const https = require('https');

const downloadContent = function(url, callback) {
	https
		.get(url, function(res) {
			var body = '';

			res.on('data', function(chunk) {
				body += chunk.toString();
			});

			res.on('end', function() {
				callback(body, null);
			});
		})
		.on('error', function(e) {
			callback(null, e);
		});
};

exports.handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	const response = event.Records[0].cf.response;

	const BASE_URL_RENDERER =
		'https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender/?url=';
	const HOST = request.headers['host'][0].value;
	const PRERENDER_URL = request.headers['x-prerender-uri'][0].value;
	const SHOULD_PRERENDER = request.headers['x-should-prerender'][0].value;
	console.log('PRERENDER_URL includes "."?', PRERENDER_URL.includes('.'));

	// Avoid requests for files
	if (SHOULD_PRERENDER === 'true' && !PRERENDER_URL.includes('.')) {
		const URL = BASE_URL_RENDERER + 'http://' + HOST + PRERENDER_URL;
		console.log('Full rendering path', URL);

		downloadContent(URL, (body, error) => {
			if (error) {
				callback(null, response);
			} else {
				console.log('body', body);

				const newResponse = {
					status: '200',
					statusDescription: 'OK',
					headers: response.headers,
					body
				};

				callback(null, newResponse);
			}
		});
	} else {
		callback(null, response);
	}
};
