'use strict';
const fs = require('mz/fs');
const path = require('path');
const Controller = require('egg').Controller;
const tinify = require('tinify');
const qiniu = require('qiniu');
const crypto = require('crypto');

/**
 * 获得文件的hash值
 * @param {String} filePath 文件路径
 * @author zuimo.sf
 * @returns {String}
 */
function getHashOfFile (filePath) {
  return getHash(fs.readFileSync(filePath, 'utf8'), 'utf8', 'md5');
}

/**
 * 获取内容的hash值
 * @param {String} content 文件内容
 * @param {String} encoding 文件编码
 * @param {String} type hash算法， 例如'md5', 'sha1', 'sha256', 'sha512'等
 * @returns {String}
 */
function getHash (content, encoding, type) {
  return crypto.createHash(type).update(content, encoding).digest('hex');
}

/**
 * 七牛云Oss上传
 * @param {String} key 上传的文件名
 * @param {String} localFile 本地文件路径
 * @param {String} ak 七牛云ak
 * @param {String} sk 七牛云sk
 */
function qiniuOssUpload (key, localFile, ak, sk) {
  let config = new qiniu.conf.Config();
  // 空间对应的机房
  config.zone = qiniu.zone.Zone_z0;
  const mac = new qiniu.auth.digest.Mac(ak, sk);
  // 上传空间
  const bucket = 'zuimo-img-object';

  //构建上传策略函数
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: bucket
  });
  const token = putPolicy.uploadToken(mac);
  
  const formUploader = new qiniu.form_up.FormUploader(config);
  const extra = new qiniu.form_up.PutExtra();

  return new Promise(function (resolve, reject) {
    formUploader.putFile(token, key, localFile, extra, function (respErr,
      respBody, respInfo) {
        if (respErr) {
          reject(respErr);
          throw respErr
        }
        if (respInfo.statusCode === 200) {
          resolve({ status: 200, body: respBody });
        } else {
          resolve({ status: respInfo.statusCode, body: respBody });
        }
    });
  })
  
}

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg';
  }

  async clipboard () {
    const { ctx } = this;
    const query = ctx.request.query;
    let data = {};
    if ('hideboss' in query) {
      data.hideboss = true;
    }
    await ctx.render('clipboard', data);
  }

  async clipboardUpload () {
    const { ctx, app } = this;
    const file = ctx.request.files[0];
    // tinify.key = app.config.tinify.key;
    // 计算文件名hash值
    const fileType = path.extname(file.filename);
    const key = getHashOfFile(file.filepath) + fileType;
    const tmpfile = path.join(app.baseDir, key);

    // ctx.service.tinify.setKey(app.config.tinify.key);
    let isValid = await ctx.service.tinify.validate(app.config.tinify.key);
    if (isValid) {
      await ctx.service.tinify.compress(file.filepath, tmpfile);
      // tinify.fromFile(file.filepath).toFile(function());
      
      let result;
      try {
        result = await qiniuOssUpload(key, tmpfile, app.config.qiniu.ossAK, app.config.qiniu.ossSK)
      } finally {
        await fs.unlink(tmpfile);
        await fs.unlink(file.filepath);
      }
  
      ctx.body = {
        data: result.body.key || null,
        message: result.status === 200 ? 'ok' : result.body.error,
        status: result.status
      }
    } else {
      ctx.body = {
        data: '图片资源本日已用尽',
        status: 10001
      }
    }

  }
}

module.exports = HomeController;
