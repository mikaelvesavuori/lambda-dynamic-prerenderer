# Lambda Dynamic Renderer

## Introduction

Dynamic Rendering is, as the name implies, about rendering a page based on a dynamic condition. What we want to do is solve the very common problem of modern Progressive Web Apps not working very well with some older crawlers that are unfortunately still in use across the web, such as on those used by Facebook and LinkedIn. Our condition is therefore ”if a crawler sees the page, give it prerendered markup”.

For this to work, we need to intercept the browser’s request BEFORE it actually hits the server to see whether the visitor is a bot or not. This repo assumes Amazon Web Services (AWS) for the entire solution. For the edge function capability, this responsibility could probably be doled out to Cloudflare Workers or similar as well.

The individual services used will be:

- S3 bucket for hosting a static page; I’ve included a very basic routed React application in the `public` folder if you need something to experiment with
- CloudFront for adding edge locations and a CDN for the S3-hosted site
- Serverless Lambda@Edge functions to intercept the browser request
- Serverless ”regular” Lambda function to run a lightweight instance of Google’s headless browser, [Puppeteer](https://www.github.com/GoogleChrome/puppeteer)

All of this magic can be fairly tedious to work with from scratch, especially if you are not accustomed to AWS. Combined with the slow deployment times, it’s not really the most user-friendly mini-project I’ve done. I hope I spare some of you out there a bit of wasted effort!

The below helps with the overall steps for manually setting everything up. You should be able to set up with Terraform or similar as well. Lambda@Edge functions through Serverless has proven hard, even with a fairly well-documented package out, so unfortunately you will have to deploy them manually through the web frontend.

## Test it

Curl or POST to `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender?url=http://d13x2tqlfdnb32.cloudfront.net/thatview`.

## Instructions

### Prerequisites

- You will need an AWS account
- Highly likely that you must have the AWS SDK installed
- Highly likely that you must be logged in through the terminal/environment
- Optional: A REST client like Insomnia if you don't really love curl'ing in your terminal

### Create a static build of a site

Use whatever you want!

A basic, routed React application is available in the `s3` folder if you need something to experiment with. The routes are `/thisview` and `/thatview`.

### Deploy the prerendering engine

1. Have an AWS account and be logged in through the terminal/environment
2. Install the dependencies in the repo with `yarn` or `npm install`
3. Run `sls deploy` to deploy the package with Serverless
4. Upon successful push, you will receive an endpoint URL, such as `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender?url=http://d13x2tqlfdnb32.cloudfront.net/thatview`
5. Test running a POST request to the prerenderer, like so: `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender?url=http://d13x2tqlfdnb32.cloudfront.net/thatview`
6. Copy the endpoint URL, and paste it into the `BASE_URL_RENDERER` constant in `functions/edgePrerenderResponse.js` (should be line 26)

### Host it in S3

1. Go to https://s3.console.aws.amazon.com/s3/
2. Deactivate anything to do with blocking access (for now, switch on things later as needed and what works)
3. Turn on _Static website hosting_, point _index_ and _errors_ document fields to `index.html`
4. Before closing the panel, note the endpoint URL
5. In the Permissions tab, add a Bucket Policy (located in `snippets/bucket-policy.json`)
6. In the Permissions tab, add a CORS configuration (located in `snippets/cors.xml`)

### Set up a CloudFront distribution for the site

1. Go to https://console.aws.amazon.com/cloudfront/
2. Click _Create new Distribution_
3. Make sure that Origin Domain Name is the endpoint URL from S3 (the one seen in ”Static website hosting” ex. http://prerender-demo.s3-website.eu-north-1.amazonaws.com)
4. Set _Allowed HTTP Methods_ to "GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE"
5. Set cache TTL items to 0 when initially testing this (you probably want caching later, though!)
6. Set _Compress Objects Automatically_ to "Yes"
7. Note the section named _Lambda Function Associations_, since this is where you will manually specify which functions are activated when requesting the CloudFront distribution
8. Finish, then go to the Error Page tab

#### Make three new error responses by clicking on Create Custom Error Response

- Set _Error caching time_ to 0
- Set _Customize Error Response_ to "Yes"
- Set _Response Page Path_ to `/index.html`
- Set _HTTP Response Code_ to 200
- The format is identical between all three error codes, except for the HTTP Error Code (400, 403, 404)

This is going to deploy for 10-15 minutes or so, so continue with the rest below.

### Create Lambda@Edge functions

These lambdas will be copy-pasted into the web code editor as support via Serverless is kind of wonky.

1. Go to https://console.aws.amazon.com/lambda/
2. Click _Create new function_
3. Select _Author from scratch_
4. Give it a good name; Node version should be 8.10
5. In _Execution Role_, choose _Create a new role with basic Lambda permissions_
6. For each function, copy-paste the supplied lambda code into the code editor
7. Under _Add triggers_ click _CloudFront_ and then _Deploy to Lambda@Edge_
8. You should be able to see the distribution you created (if not, you will have to wait for it to finish deploying)
9. Cache behavior should be "\*"
10. The CloudFront event should correspond to whatever the supplied code is named (origin request, viewer response, etc.)
11. Deploy!
12. If you cannot deploy, you should do the next section in a new tab (you need to do it anyway)
13. Repeat for all 4 functions

### Go to IAM and give permissions to the lambdas

1. Go to https://console.aws.amazon.com/iam/
2. Go to _Roles_
3. You should have roles created for each of the edge functions

#### Set access rights for functions

I am overreaching a bit on what to create, but at least the following works for me.

4. Under Permissions, click _Attach policies_
5. Filter for `AWSLambdaBasicExecutionRole` and attach it
6. When it's added, click _Add inline policy_, and go to the _JSON_ tab; paste in the contents of `snippets/log-policy.json`, save it
7. When it's added, go to the _Trust relationships_ tab and click _Edit trust relationship_; paste in the contents of `snippets/trust-policy.json`, save it

### Link all Lambda Function Associations and whitelist headers

1. Go to https://console.aws.amazon.com/lambda/
2. For each Lambda, note the ARN in the right corner (something like arn:aws:lambda:us-east-1:487572315234:function:PrerenderRequest:12)
3. You must have the last part with `:12` or whatever the number might be - this corresponds to the version number, if you don't see it click the Qualifiers/Version box and switch to the version with the highest number
4. When you have collected all the four ARNs, go to https://console.aws.amazon.com/cloudfront/
5. Go to _Distribution settings_ and then to _Behaviors_
6. If you don't have a behavior, create a new one, otherwise edit the previous
7. Make sure to whitelist the following headers: Access-Control-Request-Headers, Access-Control-Request-Method, Origin, x-prerender-uri, x-resolved-user-agent, x-should-prerender
8. At the bottom, in _Lambda Function Associations_ open one event each for viewer request, origin request, origin response, viewer response
9. In their respective _Lambda Function ARN_, paste in their corresponding ARN value including the `:12` (or whatever number) bit
10. Save
11. Once again, everything will redeploy so have the CloudFront main view open to see the progress

![CloudFront behavior settings](/cloudfront-behavior-settings.png 'CloudFront behavior settings')

### Test if it will render correctly

- Facebook Sharing Debugger: [https://developers.facebook.com/tools/debug/sharing/](https://developers.facebook.com/tools/debug/sharing/)
- Google Mobile-Friendly Test: [https://search.google.com/test/mobile-friendly](https://search.google.com/test/mobile-friendly)
- LinkedIn: [https://wwww.linkedin.com](https://wwww.linkedin.com) (will only show page title)

### Where to find logs?

Check the default Cloudwatch logs at [console.aws.amazon.com/cloudwatch/](console.aws.amazon.com/cloudwatch/).

Edge functions will pop up in whatever region gets the request. This may not always be the most obvious region, but begin in the geographically closest region and start from there.

When you test Facebook or similar, the same goes for those: These are going to be run from one of the North American regions.

## Good luck!

Many steps, but that should about do it to add dynamic rendering!
