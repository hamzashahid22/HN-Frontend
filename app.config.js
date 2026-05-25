const app = require("./app.json");

const allowInsecureCryptoStub = process.env.HN_ALLOW_INSECURE_CRYPTO_STUB === "true"
  ? true
  : app.expo.extra.allowInsecureCryptoStub;

module.exports = {
  ...app.expo,
  extra: {
    ...app.expo.extra,
    apiBaseUrl: process.env.HN_API_BASE_URL ?? app.expo.extra.apiBaseUrl,
    allowInsecureCryptoStub,
    eas: {
      ...(app.expo.extra.eas ?? {}),
      projectId: "6d584b45-50d0-4841-b7f1-5b295ac75793"
    }
  }
};
