const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 포트 설정
config.server = {
  port: 8082,
};

module.exports = config;