/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');
const fs = require('mz/fs');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1551434895922_3686';

  // add your middleware config here
  config.middleware = [];

  config.view = {
    root: [
      path.join(appInfo.baseDir, 'app/view')
    ].join(','),
    defaultViewEngine: 'nunjucks',
    defaultExtension: '.nj',
  }

  config.bodyParser = {
    jsonLimit: '1mb',
    formLimit: '5mb'
  }

  // 启动file模式，以支持上传
  config.multipart = {
    mode: 'file'
  }

  const keys = JSON.parse(fs.readFileSync(path.join(appInfo.baseDir, 'config/key.json'), { encoding: 'utf-8'}));
  
  // add your user config here
  const userConfig = {
    myAppName: 'tool-egg',
    tinify: {
      key: keys.tinyKey
    },
    qiniu: {
      ossAK: keys.qiniu.oss.ak,
      ossSK: keys.qiniu.oss.sk
    }
  };

  return {
    ...config,
    ...userConfig,
  };
};
