const https = require("https");

const PRERENDERER_ENDPOINT = "https://snab8fwm3l.execute-api.eu-north-1.amazonaws.com/dev/prerender";

/**
 * @description The third function to fire. Pre-render content if user is a bot.
 */
exports.handler = (event, context, callback) => {
	const request = event.Records[0].cf.request;
	const response = event.Records[0].cf.response;

	const BASE_URL_RENDERER = PRERENDERER_ENDPOINT + "/?url=";
	const HOST = request.headers["host"][0].value;
	const PRERENDER_URL = request.headers["x-prerender-uri"][0].value;
	const SHOULD_PRERENDER = request.headers["x-should-prerender"][0].value;

	// Avoid requests for files
	if (SHOULD_PRERENDER === "true" && !PRERENDER_URL.includes(".")) {
		// INFO: For various reasons, I've used http here, but feel free to change or improve this for your case
		const URL = BASE_URL_RENDERER + "http://" + HOST + PRERENDER_URL;
		console.log("Full rendering path", URL);

		downloadContent(URL, (body, error) => {
			if (error) {
				callback(null, response);
			} else {
				console.log("body", body);

				const NEW_RESPONSE = {
					status: "200",
					statusDescription: "OK",
					headers: response.headers,
					body,
				};

				callback(null, NEW_RESPONSE);
			}
		});
	} else {
		callback(null, response);
	}
};

/**
 * @description Download content with Node https module
 */
const downloadContent = function (url, callback) {
	https
		.get(url, function (res) {
			let body = "";

			res.on("data", function (chunk) {
				body += chunk.toString();
			});

			res.on("end", function () {
				callback(body, null);
			});
		})
		.on("error", function (e) {
			callback(null, e);
		});
};