'use strict';

exports.handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	console.log('request', request);
	const headers = request.headers;
	console.log('headers', headers);

	const customUserAgentHeaderName = 'x-resolved-user-agent';
	const realUserAgent = (() => {
		if (headers[customUserAgentHeaderName]) {
			if (headers[customUserAgentHeaderName][0]) {
				if (headers[customUserAgentHeaderName.toLowerCase()][0].value) {
					return headers[customUserAgentHeaderName.toLowerCase()][0].value;
				} else return 'none';
			} else return 'none';
		} else return 'none';
	})();

	console.log('realUserAgent', realUserAgent);

	headers['user-agent'] = [
		{
			key: 'User-Agent',
			value: realUserAgent
		}
	];

	request.headers['x-prerender-uri'] = [{ key: 'x-prerender-uri', value: request.uri }];

	const SHOULD_PRERENDER = checkIfBot(realUserAgent).toString();
	const OLD_URI = request.uri;
	const NEW_URI = OLD_URI.replace(/\/$/, '/index.html');
	request.uri = NEW_URI;

	request.headers['x-should-prerender'] = [{ key: 'x-should-prerender', value: SHOULD_PRERENDER }];
	callback(null, request);
};

function checkIfBot(userAgent) {
	if (userAgent) {
		console.log('checkIfBot userAgent:', userAgent);

		const botUserAgents = [
			'Baiduspider',
			'bingbot',
			'Embedly',
			'facebookexternalhit',
			'LinkedInBot',
			'outbrain',
			'pinterest',
			'quora link preview',
			'rogerbot',
			'showyoubot',
			'Slackbot',
			'TelegramBot',
			'Twitterbot',
			'vkShare',
			'W3C_Validator',
			'WhatsApp'
		];

		let containsBotKeyword = botUserAgents.find(element => {
			const substr = new RegExp(`${element}`);
			return substr.test(userAgent.toLowerCase());
		});

		if (containsBotKeyword !== undefined) {
			containsBotKeyword = true;
		} else if (containsBotKeyword === undefined) {
			containsBotKeyword = false;
		}

		console.log('containsBotKeyword', containsBotKeyword);

		return containsBotKeyword;
	}
	return false;
}
