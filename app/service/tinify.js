const Service = require('egg').Service;
const tinify = require('tinify');
const fs = require('mz/fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

class TinifyService extends Service {
    setKey (key) {
        tinify.key = key;
    }

    compressionCount () {
        return tinify.compressionCount;
    }

    leftCount () {
        const total = 500;
        return total - Number(this.compressionCount());
    }

    async validate (key) {
        console.log('正在认证tinyPng的key...');
        this.setKey(key);

        return new Promise(resolve => {
            tinify.validate((err) => {
                if (err) {
                    console.log(err);
                    return resolve(false);
                }
                console.log('认证成功');
                const left = this.leftCount();
                if (left <= 0) {
                    console.log('当前key的剩余可用数已用尽，请更换key重试!');
                    return resolve(false);
                }
                console.log(`当前key剩余可用数为 ${left}`);
                resolve(true);
            })
        })
    }

    writeFilePromise (file, content, cb) {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, content, (err) => {
                if (err) {
                    return reject(err);
                }
                cb && cb();
                resolve();
            })
        })
    }

    toBufferPromise (sourceData) {
        return new Promise((resolve, reject) => {
            tinify.fromBuffer(sourceData).toBuffer((err, resultData) => {
                if (err) {
                    return reject(err);
                }
                resolve(resultData);
            })
        })
    }

    async compress (source, target) {
        try {
            console.log(`开始压缩图片 ${source}`);
            const sourceData = await readFile(source);
            const resultData = await this.toBufferPromise(sourceData);
            await this.writeFilePromise(target, resultData, () => {
                console.log('图片压缩成功');
            })
        } catch (ex) {
            throw new Error(ex.message);
        }
    }
}

module.exports = TinifyService;