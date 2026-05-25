import { createInitialKeyBundle } from "../e2ee";

jest.mock("../../../config", () => ({
  config: {
    allowInsecureCryptoStub: false,
    apiBaseUrl: "http://localhost:4000"
  }
}));

jest.mock("hm-e2ee", () => ({
  assertNativeE2eeAvailable: async () => {
    throw new Error("Native Signal/libsignal E2EE provider is not available in this build.");
  },
  HmE2ee: {}
}));

describe("E2EE adapter", () => {
  it("fails closed when the native provider is unavailable", async () => {
    await expect(createInitialKeyBundle()).rejects.toThrow("Native Signal/libsignal");
  });
});
