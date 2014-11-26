/*!
 * 文件描述
 * @author ydr.me
 * @create 2014-11-26 23:43
 */

'use strict';

var fs = require('fs');

/**
 * 构造一个 oss
 * @param options
 * @param options.host 域
 * @param options.bucket 库
 * @param options.accessKey 请求 key
 * @param options.accessSecret 请求 secret
 */
module.exports = function (options) {
    this.host = options.host;
    this.bucket = options.bucket;
    this.accessKey = options.accessKey;
    this.accessSecret = options.accessSecret;
    this.urlPrefix = 'http://' + this.bucket + '.' + this.host + '/';
};
