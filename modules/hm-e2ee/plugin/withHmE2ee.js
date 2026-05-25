const { withAppBuildGradle, withProjectBuildGradle } = require("@expo/config-plugins");

function ensureBlock(source, marker, block) {
  return source.includes(marker) ? source : `${source}\n${block}\n`;
}

function withHmE2ee(config) {
  config = withProjectBuildGradle(config, (mod) => {
    const marker = "https://build-artifacts.signal.org/libraries/maven/";
    mod.modResults.contents = ensureBlock(
      mod.modResults.contents,
      marker,
      `
allprojects {
    repositories {
        maven { url "https://build-artifacts.signal.org/libraries/maven/" }
    }
}
`
    );
    return mod;
  });

  config = withAppBuildGradle(config, (mod) => {
    const signalDependency = "org.signal:libsignal-android";
    if (!mod.modResults.contents.includes(signalDependency)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    implementation "org.signal:libsignal-android:0.94.1"
    implementation "org.signal:libsignal-client:0.94.1"`
      );
    }

    const packagingMarker = "libsignal_jni*.dylib";
    if (!mod.modResults.contents.includes(packagingMarker)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /android\s*\{/,
        `android {
    packagingOptions {
        resources {
            excludes += ["libsignal_jni*.dylib", "signal_jni*.dll", "libsignal_jni_testing.so"]
        }
    }`
      );
    }

    return mod;
  });

  return config;
}

module.exports = withHmE2ee;
