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
var bucket = 'ydrimg';
var object = 'test/xx.png';
var url = 'http://ydrimg.oss-cn-hangzhou.aliyuncs.com/' + object;
var file = path.join(__dirname, '../test/error.png');
var expires = Date.now() + 10000;
var headers = {
    'content-md5': '',
    'content-type': 'image/png',
    'expires': new Date(expires).toUTCString(),
    'cache-control': 'public'
};


//ydrUtil.dato.extend(headers, auth({
//    accessKeyId: '',
//    accessKeySecret: '',
//    bucket: 'ydrimg',
//    object: object,
//    method: 'PUT'
//}, headers));
//
//
//ydrUtil.request.put({
//    url: url,
//    headers: headers,
//    body: fs.createReadStream(file)
//}, function (err, body, res) {
//    console.log(err);
//    console.log(body);
//    ydrUtil.request.head(url, function (err, headers) {
//        console.log(headers);
//    });
//});
