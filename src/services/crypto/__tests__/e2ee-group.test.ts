jest.mock("../../../config", () => ({
  config: {
    allowInsecureCryptoStub: true,
    apiBaseUrl: "http://localhost:4000"
  }
}));

jest.mock("hm-e2ee", () => ({
  assertNativeE2eeAvailable: jest.fn(),
  HmE2ee: {}
}));

import { encryptMessage } from "../e2ee";

describe("group E2EE metadata", () => {
  it("marks group messages with sender-key mode and epoch", async () => {
    const encrypted = await encryptMessage(
      "hello group",
      "conv_group",
      [
        {
          userId: "user_2",
          deviceId: "device_2",
          identityKey: "identity",
          signedPreKey: { keyId: 1, publicKey: "signed", signature: "sig" },
          oneTimePreKey: null,
          kyberPreKey: null
        }
      ],
      { type: "GROUP", groupSenderKeyVersion: 7 }
    );

    expect(encrypted.encryptionHeader).toMatchObject({
      mode: "GROUP_SENDER_KEY",
      conversationId: "conv_group",
      groupSenderKeyVersion: 7,
      recipients: [{ userId: "user_2", deviceId: "device_2" }]
    });
  });
});
