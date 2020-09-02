# Monorepo: Gatsby + Netlify + Sanity
Example application supporting the development and deployment of a Gatsby frontend with a Sanity CMS, both on the same domain.

## Background
In many example works and production builds one will find within this community, the Sanity CMS is developed and deployed as existing on its own domain, whether in development (via Sanity's development server, running on a separate port from Gatsby's) or in production (via Sanity's hosting service, running on a separate URL from the web app itself).

People do seem to be fine with this setup, and clients haven't seemed to mind needing to sign into a separate URL from their app itself to manage their app's content. However, it is possible to host both a Sanity CMS and frontend web app (in this case, with Gatsby, although equally doable with webpack for development and on any standard production environment).

In this setup we show how to configure your base Sanity and Gatsby environments to run simultaneously on the same domain. In development, you will access your CMS from `http://localhost:8080/admin`, where `http://localhost:8080` is the address of the user-facing app itself. Likewise, in production you will access your CMS from `http://my-app.com/admin`, where `http://my-app.com` is the domain of the app itself.

NOTE: The main underlying assumption for this setup beyond the use of Gatsby and Sanity is that production hosting will be managed with Netlify, as the setup that accomplishes our goals involves proxying requests from within Netlify (in both development and production) in order to pass requests from `/admin` to the CMS as opposed to the user-facing app. This setup is totally possible on other systems, although configuration will vary.


## Prerequisites
Development within this codebase relies on use of [Netlify Dev](https://www.netlify.com/products/dev/), and therefor of the Netlify CLI. If you do not already have this installed globally, you should do so:

```
npm install netlify-cli -g
```

This codebase also relies on use of the [Sanity CLI](https://www.sanity.io/docs/getting-started-with-sanity-cli). If you do not already have this installed globally, you should do so:

```
npm install @sanity/cli -g
```


This codebase was developed using version `2.47.0` of `netlify-cli` and version `1.150.1` of `sanity`, on Node `14.7.0`, both the most recent releases at the time of this writing. If you run into issues please check for changes or differences between your version of `netlify-cli` and of Node.

## Install
1. Clone this repo to your working directory by running `git clone git@github.com:bradley/gatsby-netlify-sanity-monorepo`.
2. Remove git from the cloned repo (you can add it back for yourself later, but no use and keeping your clone tracked with my source version). *From within the `gatsby-netlify-sanity-monorepo` directory you have just cloned*, run `rm -rf .git`.
3. Install root dependencies by running `npm install`.
4. Install dependencies for the user-facing app (`/lib/web`) and the Sanity app (`/lib/studio`) by running `npm run prebuild`. You wont have to run this all the time, it's just a shorthand for installing the dependencies in both the `/lib/web` and `/lib/studio` directories. When you build those directories out you should just `npm install` within each of them as you add packages you need.
5. You need to go into the directory for the Sanity app (`/lib/studio`) and update the configuration to point to a Sanity project you manage. Change directories so that you are in the `/lib/studio` directory in your terminal, and then run `sanity init`. This will make the necessary changes to the existing `sanity.json` file there to point to your Sanity project. Note that there is existing code in the `sanity.json` file that you should not override (until you understand it).
6. Lastly, you also need to tell Sanity to accept CORS requests from port `8000` in development. While we'll cover this a little more later, for now you need to go to the settings page for your project on `http://sanity.io`. Go to `https://manage.sanity.io/projects/<YOUR PROJECT ID>/settings/api` and click `Add New Origin` and add `http://localhost:8888`, being sure to also toggle the `Allow Credentials` option to `true` before saving.

## Development
As stated earlier, we use [Netlify Dev](https://www.netlify.com/products/dev/) to run the application in development. To start both the Sanity CMS and the user-facing app simulateously, run:

```
netlify dev
```

After this starts, your user-facing app will be available on `http://localhost:8888` and your Sanity CMS will be available at `http://localhost:8888/admin`.

## How does this work?
The essential gist of how this setup works begins with the following knowledge:
1. During development, Gatsby runs a development server that serves its content on the localhost port `8000`.
2. During development, Sanity runs a development server that serves its content on the localhost port `3333`.
3. During development, Netlify runs a development server that serves its content on the localhost port `8888`.

Now, because we are using Netlify Dev to run our application, and because it is so common to run development servers that Netlify Dev will proxy its requests to during development, Netlify Dev has a development configuration option for `targetPort`, which it [describes as](https://github.com/netlify/cli/blob/master/docs/netlify-dev.md):

> The port for your application server, framework or site generator.

With this in mind, if you look in our `netlify.toml`, you'll see that the `targetPort` for development is set to point at our Gatsby port, `8000`. This is the standard way to set up Netlify with whatever development server your app needs (again, Gatsby's in our case), and you're probably already familiar with it. But how do we get Sanity working on the same port?

### Sanity on Gatsby's Port During Development
In order to access our Sanity project on Gatsby's port, `8888`, during development, we need to set some configurations in both the Gatsby and Sanity codebases (this is already done in this repo, but you can still follow along).

From the Gatsby codebase (`/lib/web`), look in the `gatsby-config.js` file. Here we have defined a proxy telling the Gatsby development server to proxy all requests to any path beginning with `/admin` to the server running on port `3333`, or, Sanity's development server.

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = {
  developMiddleware: app => {
    app.use(
      "/admin/",
      createProxyMiddleware({
        target: "http://localhost:3333",
        secure: false,
        changeOrigin: true,
        cookieDomainRewrite: true,
      })
    )
  },
};
```

Since you've already told Sanity to allow requests to your project via port `8888` (step 6 of the "Install" section above), all that is left to do now is to tell the Sanity codebase (`/lib/studio`) that its "root" is `/admin` and not `/`. From the Sanity codebase (`/lib/studio`), look in the `sanity.json` file. Here we have added a configuration to the `"project"` definition for `"basePath"`, which will tell Sanity to treat `/admin` as its root:

```
{
  "project": {
    "basePath": "/admin",
    ...
  },
  ...
}
```

### Sanity Sharing User-Facing App Domain on Netlify During Production
In order for Sanity to run on the same domain as our user-facing application when deployed to Netlify, we need to similarly tell Netlify how to redirect (rather than proxy) requests to `/admin` paths to the bundled Sanity app and not the bundled Gatsby app.

If you were to run `npm build` from the root directory of this codebase, both the `studio` and `web` apps would be bundled into a new directory for `/dist`. This directory serves as the fundamental entrypoint for our apps once on Netlify. Beyond the various spots where we tell Netlify to reference `/dist` in our `netlify.toml`, we further tell Netlify to set up an HTTP redirect - one that it will use once deployed on production - for requests to `/admin` so that requests to this path will serve the bundled Sanity `index.html` file rather than the normal `index.html` file for the user-facing app that it serves on other requests. From the `netlify.toml` file, see how redirects are set up:

```
# Handle redirect to `admin` entrypoint for paths to `/admin/*` content.
[[redirects]]
  from = "/admin/*"
  to = "/studio/:splat"
  status = 200
  force = false

# Handle redirect to main `app` entrypoint for paths to any root, `/*`, content.
[[redirects]]
  from = "/*"
  to = "/web/:splat"
  status = 200
  force = false
```

## Deployment
Deployment is handled using the standard Netlify workflow. Build commands and other configurations can be viewed in `netlify.toml`.

Once your GitHub repo is connected to Netlify (or once you've set up an alternative Netlify deployment approach), the app should deploy without issue. However, given we are wanting to - again - access the Sanity CMS from our custom domain, you will need to perform the final step of telling Sanity to accept requests from the URL of your app on Netlify for production. This is pretty much the same step as step 6 in the Install steps from earlier, and follows Sanity's [guidlines](https://www.sanity.io/docs/cors) for custom deployments.

Go to `https://manage.sanity.io/projects/<YOUR PROJECT ID>/settings/api` and click `Add New Origin` and add the custom domain for your Netlify site (e.g.; `https://foo-bar-123.netlify.app`), being sure to also toggle the `Allow Credentials` option to `true` before saving. You'll only have to do this once, unless you change the domain in the future.


