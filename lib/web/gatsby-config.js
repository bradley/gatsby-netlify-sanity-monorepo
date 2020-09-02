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
