echo "Removing demo website bucket..."
aws s3 rb <target> [--options]

echo "Removing prerenderer..."
sls remove --config serverless.yml

echo "Removing prerenderer edge functions..."
sls remove --config serverless.edge.yml

echo "NOTE #1: Lambda@Edge functions currently will not be automatically removed. Please remove those manually!"

echo "NOTE #2: You will also need to remove the Cloudfront distribution manually."