const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

exports.handler = async (event, context, callback) => {
	const ERROR_MESSAGE = "No query parameter given!";
	const HEADERS = {
		"Access-Control-Allow-Origin":
			process.env.ALLOW_ORIGIN || '*',
		"Access-Control-Request-Method": "POST",
	};

	if (event.queryStringParameters) {
		const TARGET_URL = event.queryStringParameters.url;

		// Failure
		if (!TARGET_URL) {
			callback(null, {
				statusCode: 400,
				headers: HEADERS,
				body: ERROR_MESSAGE,
			});
		}

		const BROWSER = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath,
			headless: chromium.headless,
		});

		return new Promise(async (resolve, reject) => {
			let page = await BROWSER.newPage();
			await page.goto(TARGET_URL);
			const RESULT = await page.content();
			resolve(RESULT);
		}).then((RESULT) => {
			console.log("result", RESULT);
			BROWSER.close();

			// Success
			callback(null, {
				statusCode: 200,
				headers: HEADERS,
				body: RESULT,
			});
		});
	} else {
		// Failure
		callback(null, {
			statusCode: 400,
			headers: HEADERS,
			body: ERROR_MESSAGE,
		});
	}
};
