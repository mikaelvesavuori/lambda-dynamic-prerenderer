#######################################################
# This deploys a test site into an AWS S3 bucket      #
# and sets up an AWS Cloudfront distribution so you   #
# can access the site, in preparation of us deploying #
# Lambda@Edge functions for pre-rendering.            #
#######################################################

export BUCKET_NAME=lambda-prerenderer-3kjrk32d  # Name of your bucket; must be unique
export APP_FOLDER=demo-site-s3                  # Name of folder with content; this is the provided demo content

# Install dependencies
npm install

# Deploy the pre-rendering engine
npm run deploy

# Create new S3 bucket, set it to host static websites, and copy files into it
aws s3 mb s3://$BUCKET_NAME
aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document index.html
aws s3 cp $APP_FOLDER s3://$BUCKET_NAME/ --recursive

# Make bucket contents public
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://snippets/bucket-cors.json
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://snippets/bucket-policy.json