import Constants from "expo-constants";

export const config = {
  apiBaseUrl: (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? "http://localhost:4000",
  allowInsecureCryptoStub: Constants.expoConfig?.extra?.allowInsecureCryptoStub === true
};
