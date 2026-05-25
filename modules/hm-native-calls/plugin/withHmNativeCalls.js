const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

function withHmNativeCalls(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIBackgroundModes = Array.from(new Set([...(mod.modResults.UIBackgroundModes || []), "voip", "audio"]));
    return mod;
  });

  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    for (const permission of [
      "android.permission.RECORD_AUDIO",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MICROPHONE",
      "android.permission.USE_FULL_SCREEN_INTENT",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.WAKE_LOCK"
    ]) {
      if (!manifest["uses-permission"].some((item) => item.$["android:name"] === permission)) {
        manifest["uses-permission"].push({ $: { "android:name": permission } });
      }
    }
    return mod;
  });

  return config;
}

module.exports = withHmNativeCalls;
