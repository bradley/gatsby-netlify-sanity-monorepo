# Functions - Netlify
All folders in the root of this directory hold individual [AWS Lambda Functions](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html), intended for deployment and management via Netlify. As such, they will primarily act as supportive wrappers exposing necessary HTTP endpoints for backend work that cannot be otherwise managed or performed by the frontend alone. Anything that needs further configuration or capabilities than the basic form provided by Netlify should be managed and deployed independently.

Lambda functions in this directory are managed and deployed by Netlify as part of its continuous integration flow. This has some costs in addition to its benefits. In any case, functions in this directory can be considered as automatically deployed whenever the main app bundle is by Netlify.

## Development
Note that the structure of Netlify-managed Lambda functions need to conform to certain guidelines. Read any and all official Netlify Functions documentation to learn more. You can start [here](https://docs.netlify.com/cli/get-started/#unbundled-javascript-function-deploys).
