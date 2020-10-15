"use strict";

/**
 * @description The second function to fire. This checks the passed-in user agent header to verify if user is a bot.
 */
exports.handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	console.log("request", request);
	const headers = request.headers;
	console.log("headers", headers);

	const CUSTOM_UA_HEADER = "x-resolved-user-agent";
	const REAL_UA = (() => {
		if (headers[CUSTOM_UA_HEADER]) {
			if (headers[CUSTOM_UA_HEADER][0]) {
				if (headers[CUSTOM_UA_HEADER.toLowerCase()][0].value) {
					return headers[CUSTOM_UA_HEADER.toLowerCase()][0].value;
				} else return "none";
			} else return "none";
		} else return "none";
	})();

	console.log("Real user agent:", REAL_UA);

	headers["user-agent"] = [
		{
			key: "User-Agent",
			value: REAL_UA,
		},
	];

	request.headers["x-prerender-uri"] = [
		{ key: "x-prerender-uri", value: request.uri },
	];

	const SHOULD_PRERENDER = checkIfBot(REAL_UA).toString();
	const OLD_URI = request.uri;
	const NEW_URI = OLD_URI.replace(/\/$/, "/index.html");
	request.uri = NEW_URI;

	request.headers["x-should-prerender"] = [
		{ key: "x-should-prerender", value: SHOULD_PRERENDER },
	];
	callback(null, request);
};

/**
 * @description Verify user agent against list of known bot agents
 * @returns boolean
 */
function checkIfBot(userAgent) {
	if (userAgent) {
		console.log("checkIfBot userAgent:", userAgent);

		const botUserAgents = [
			'googlebot',
			'google-structured-data-testing-tool',
			'mediapartners-google',
			"Baiduspider",
			"bingbot",
			"Embedly",
			"facebookexternalhit",
			"LinkedInBot",
			"outbrain",
			"pinterest",
			"quora link preview",
			"rogerbot",
			"showyoubot",
			"Slackbot",
			"TelegramBot",
			"Twitterbot",
			"vkShare",
			"W3C_Validator",
			"WhatsApp",
		];

		let containsBotKeyword = botUserAgents.find((element) => {
			const substr = new RegExp(`${element.toLowerCase()}`);
			return substr.test(userAgent.toLowerCase());
		});

		if (containsBotKeyword !== undefined) {
			containsBotKeyword = true;
		} else if (containsBotKeyword === undefined) {
			containsBotKeyword = false;
		}

		console.log("containsBotKeyword", containsBotKeyword);

		return containsBotKeyword;
	}
	return false;
}
