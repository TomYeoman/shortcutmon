import { build } from 'electron-builder';

build({
  config: {
    productName: 'Shortcutmon',
    artifactName: '${productName}-${version}-${platform}-${arch}.${ext}',
    files: ['dist/**/*'],
    directories: {
      output: 'dist',
      buildResources: 'build',
    },
    win: {
      // target: ['zip', 'nsis', 'portable'],
      target: ['nsis'],
      icon: 'build/icon.png',
    },
    nsis: {
      artifactName: '${productName}-${version}-installer.${ext}',
    },
    // "portable": { "artifactName": "${productName}-${version}-portable.${ext}" },
    // mac: {
    //   identity: null,
    //   target: ['default'],
    //   icon: 'assets/icon.icns',
    // },
  },
});
