/*!
 * 上传
 * @author ydr.me
 * @create 2014-11-26 22:58
 */

'use strict';

var auth = require('./auth.js');
var path = require('path');
var fs = require('fs');
var request = require('request');
var ydrUtil = require('ydr-util');

module.exports = function () {

};


////////////////////////////////////////////////////////
var ossConfig = fs.readFileSync('/Users/zhangyunlai/Documents/aliyun/oss/key.json', 'utf8');
ossConfig = JSON.parse(ossConfig);
var bucket = 'ydrimg';
var object = 'test/xx.png';
var url = 'http://ydrimg.oss-cn-hangzhou.aliyuncs.com/' + object;
var file = path.join(__dirname, '../test/x.png');
var expires = Date.now() + 10000;
var headers = {
    'Content-MD5': '',
    'Content-Type': 'image/png',
    Date: new Date().toUTCString(),
    'expires': new Date(expires).toUTCString(),
    'cache-control': 'public'
};


ydrUtil.dato.extend(headers, auth({
    accessKeyId: ossConfig.accessKeyId,
    accessKeySecret: ossConfig.accessKeySecret,
    bucket: 'ydrimg',
    object: object,
    method: 'PUT'
}, headers));


ydrUtil.request.put(url, {
    headers: headers,
    file: file
}, function (err, body, res) {
    ydrUtil.request.head(url, function (err, headers) {
        console.log(headers);
    });
});
