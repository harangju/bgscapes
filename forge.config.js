const path = require('path');
const fs = require('fs');
const packageJson = require('./package.json');

const config = {
  "packagerConfig": {
    "icon": "build/icon.icns",
    "osxSign": {
      "identity": "Developer ID Application: Harang Ju (9VPE894343)",
      "hardened-runtime": true,
      "gatekeeper-assess": false,
      "entitlements": "static/entitlements.plist",
      "entitlements-inherit": "static/entitlements.plist",
      "signature-flags": "library"
    },
  },
  "makers": [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": "BGScapes"
      }
    },
    {
      "name": "@electron-forge/maker-zip",
      "platforms": [
        "darwin"
      ]
    },
    {
      "name": "@electron-forge/maker-deb",
      "config": {}
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {}
    }
  ]
}

function notarizeMaybe() {
  if (process.platform !== 'darwin') {
    return;
  }

  // if (!process.env.CI) {
  //   console.log(`\nNot in CI, skipping notarization`);
  //   return;
  // }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn(
      '\nShould be notarzing, but environment variables APPLE_ID or APPLE_ID_PASSWORD are missing!'
    );
    return;
  }

  config.packagerConfig.osxNotarize = {
    appBundelId: 'com.electron.bgscapes',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  };
}

notarizeMaybe();

module.exports = config;
