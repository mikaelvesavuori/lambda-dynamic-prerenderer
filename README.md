# Lambda Dynamic Prerenderer

## Introduction

Dynamic Rendering is, as the name implies, about rendering a page based on a dynamic condition. What we want to do is solve the very common problem of modern Progressive Web Apps not working very well with some older crawlers that are unfortunately still in use across the web, such as on those used by Facebook and LinkedIn. Our condition is therefore ”if a crawler or bot sees the page, give it prerendered markup”.

For this to work, we need to intercept the browser’s request BEFORE it actually hits the server to see whether the visitor is a bot or not. This repo assumes Amazon Web Services (AWS) for the entire solution. For the edge function capability, this responsibility could probably be doled out to Cloudflare Workers or similar as well.

The individual services used will be:

- S3 bucket for hosting a static page. I’ve included a very basic routed React application in the `public` folder if you need something to experiment with.
- CloudFront for adding edge locations and a CDN for the S3-hosted site.
- Serverless Lambda@Edge functions (4, to be exact) to intercept the browser request.
- Serverless ”regular” Lambda function to run a lightweight instance of Google’s headless browser, [Puppeteer](https://www.github.com/GoogleChrome/puppeteer).

All of this magic can be fairly tedious to work with from scratch, especially if you are not accustomed to AWS. Combined with the slow deployment times, it’s not really the most user-friendly mini-project I’ve done. I hope I spare some of you out there a bit of wasted effort!

The below helps with the overall steps for setting everything up, with some steps automated and some manual. Since my last version, Serverless Framework has added more support for Lambda@Edge functions, but still not enough to make me capable of deploying all the functions and setting up Cloudfront the way it's supposed to be. Note that I am not saying it's not possible, but you won't find it working like that in this repo. [You should be able to automate everything (minus function deployment) through Terraform](ttps://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution) if that's your poison of choice.

_An improvement on this prerenderer would be to include render-caching capabilities so you need to do less processing._

## Instructions

### Prerequisites

- You will need an AWS account
- You will need [Serverless Framework](https://www.serverless.com) installed if you are going to use the automated approach
- Highly likely that you need to have the [AWS CLI](https://aws.amazon.com/cli/) installed
- Highly likely that you need to be logged in through the terminal/environment
- Optional: A REST client like [Insomnia](https://insomnia.rest) if you don't really love to curl in your terminal

### Create a static build of a site

Use whatever you want!

A basic, routed React application is available in the `demo-site-s3` folder if you need something to experiment with. The routes are `/thisview` and `/thatview`.

### Deploy the site and prerendering engine (automated)

Make sure you have an AWS account and that you're logged in through the terminal/environment.

1. Open `deploy-demo-site.sh` and set a unique bucket name
2. Run `deploy-demo-site.sh`
3. Upon successful deployment you will receive an endpoint URL such as `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender`
4. Try running a GET request to the prerenderer, like so: `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender?url=http://d13x2tqlfdnb32.cloudfront.net/`
5. Copy the endpoint URL, and paste it into the `PRERENDERER_ENDPOINT` constant in `src/edge/originResponse.js` (should be line 3)

### Deploy the site and prerendering engine (manual)

Make sure you have an AWS account and that you're logged in through the terminal/environment.

#### Host the site in S3

1. Go to https://s3.console.aws.amazon.com/s3/
2. Deactivate anything to do with blocking access (for now, switch on things later as needed and what works)
3. Turn on _Static website hosting_, point _index_ and _errors_ document fields to `index.html`
4. Before closing the panel, note the endpoint URL
5. In the Permissions tab, add a Bucket Policy (located in `snippets/bucket-policy.json`)
6. In the Permissions tab, add a CORS configuration (located in `snippets/cors.xml`)

#### Deploy prerenderer

7. Install the dependencies in the repo with `yarn` or `npm install`
8. Run `sls deploy` to deploy the package with Serverless
9. Upon successful deployment you will receive an endpoint URL such as `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender`
10. Try running a GET request to the prerenderer, like so: `https://uxj5ky4iw8.execute-api.eu-north-1.amazonaws.com/dev/prerender?url=http://d13x2tqlfdnb32.cloudfront.net/`
11. Copy the endpoint URL, and paste it into the `PRERENDERER_ENDPOINT` constant in `src/edge/originResponse.js` (should be line 3)

### Set up a CloudFront distribution for the site

1. Go to [https://console.aws.amazon.com/cloudfront/](https://console.aws.amazon.com/cloudfront/)
2. Click _Create new Distribution_
3. Make sure that Origin Domain Name is the endpoint URL from S3 (the one seen in ”Static website hosting”, which looks something like `http://prerender-demo.s3-website.eu-north-1.amazonaws.com`)
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

This is going to deploy for 5-15 minutes, so continue with the rest below.

### Create Lambda@Edge functions (automated)

This is highly recommended, and will save you _lots_ of time compared to doing it manually.

- Run `npm run deploy:edge`

### Create Lambda@Edge functions (manual)

1. Go to [https://console.aws.amazon.com/lambda/](https://console.aws.amazon.com/lambda/)
2. Click _Create new function_
3. Select _Author from scratch_
4. Give it a good name; Node version should be 12
5. In _Execution Role_, choose _Create a new role with basic Lambda permissions_
6. For each function, copy-paste the supplied lambda code into the code editor
7. Under _Add triggers_ click _CloudFront_ and then _Deploy to Lambda@Edge_
8. You should be able to see the distribution you created (if not, you will have to wait for it to finish deploying)
9. Cache behavior should be "\*"
10. The CloudFront event should correspond to whatever the supplied code is named (origin request, viewer response, etc.)
11. Deploy!
12. If you cannot deploy, you should do the next section in a new tab (you need to do it anyway)
13. Repeat for all 4 functions

#### Go to IAM and give permissions to the lambdas

1. Go to [https://console.aws.amazon.com/iam/](https://console.aws.amazon.com/iam/)
2. Go to _Roles_
3. You should have roles created for each of the edge functions

#### Set access rights for functions

I am overreaching a bit on what to create, but at least the following works for me.

4. Under Permissions, click _Attach policies_
5. Filter for `AWSLambdaBasicExecutionRole` and attach it
6. When it's added, click _Add inline policy_, and go to the _JSON_ tab; paste in the contents of `snippets/lambda-log-policy.json`, save it
7. When it's added, go to the _Trust relationships_ tab and click _Edit trust relationship_; paste in the contents of `snippets/lambda-iam-trust-policy.json`, save it

### Link all Lambda Function Associations and whitelist headers

1. Go to [https://console.aws.amazon.com/lambda/](https://console.aws.amazon.com/lambda/)
2. For each Lambda, note the ARN in the right corner (something like `arn:aws:lambda:us-east-1:487572315234:function:PrerenderRequest:12`)
3. You must have the last part with `:12` or whatever the number might be - this corresponds to the version number, if you don't see it click the Qualifiers/Version box and switch to the version with the highest number
4. When you have collected all the four ARNs, go to [https://console.aws.amazon.com/cloudfront/](https://console.aws.amazon.com/cloudfront/)
5. Go to _Distribution settings_ and then to _Behaviors_
6. If you don't have a behavior, create a new one, otherwise edit the previous
7. Make sure to whitelist the following headers: `Access-Control-Request-Headers`, `Access-Control-Request-Method`, `Origin`, `x-prerender-uri`, `x-resolved-user-agent`, `x-should-prerender`
8. At the bottom, in _Lambda Function Associations_ open one event each for viewer request, origin request, origin response, viewer response
9. In their respective _Lambda Function ARN_, paste in their corresponding ARN value including the `:12` (or whatever number) bit
10. Save
11. Once again, everything will redeploy so have the CloudFront main view open to see the progress

![CloudFront behavior settings](/cloudfront-behavior-settings.png "CloudFront behavior settings")

### Test if it will render correctly

Services that should be able to give you an indication of functionality:

- Facebook Sharing Debugger: [https://developers.facebook.com/tools/debug/sharing/](https://developers.facebook.com/tools/debug/sharing/)
- Google Mobile-Friendly Test: [https://search.google.com/test/mobile-friendly](https://search.google.com/test/mobile-friendly)
- LinkedIn: [https://www.linkedin.com](https://www.linkedin.com)

If you use Insomnia or Postman, you can try GETting your Cloudfront distribution with a `user-agent` header like `googlebot` and it should respond with rendered HTML. Removing the header should in turn start returning the basic non-rendered HTML again.

### Where to find logs?

Check the default Cloudwatch logs at [console.aws.amazon.com/cloudwatch/](console.aws.amazon.com/cloudwatch/). Edge functions are currently only available in the `us-east-1` region, so look for those logs in that region. Logs may also show up in whatever region the CDN thinks you are in, so in case you actually don't find any logs, look in regions close to you.

When you test Facebook or similar, the same goes for those: These are most likely going to be run from one of the North American regions.

### Teardown

Run the `teardown.sh` script. Also read the below from [Serverless Framework's blog post on Lambda@Edge support](https://www.serverless.com/blog/lambda-at-edge-support-added):

```
**A note about removals**

When you’re done with testing you might want to remove the service via serverless remove. Note that the removal also takes a little bit longer and won’t remove your Lambda@Edge functions automatically. The reason is that AWS has to cleanup your functions replicas which can take a couple of hours. Removing the Lambda functions too early would result in an error.

The solution for this problem right now is to manually remove the Lambda@Edge functions via the AWS console after a couple of hours. You might want to automate this process with a script which issues AWS SDK calls to streamline this cleanup process.
```

Long story short: You will need to remove Cloudfront and Lambda@Edge functions manually.

## Good luck!

Many steps, but that should about do it to add dynamic rendering!
