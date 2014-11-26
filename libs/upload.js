/*!
 * 上传
 * @author ydr.me
 * @create 2014-11-26 22:58
 */

'use strict';

//var oss = require('oss-client');
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
var file = path.join(__dirname, '../test/x.png');
var headers = {
    'Content-MD5': '',
    'Content-Type': 'image/png',
    Date: new Date().toUTCString()
};


ydrUtil.dato.extend(headers, auth({
    accessKeyId: 'hLtdWgRPpKcj6Ezv',
    accessKeySecret: 'uoC6D82o4VkE5mInBT8eDOsCFZCEj0',
    bucket: 'ydrimg',
    object: object,
    method: 'PUT'
}, headers));

//console.log(headers);

ydrUtil.request.put(url, {
    headers: headers,
    file: file
}, function (err, body, res) {
    console.log(res.statusCode);
    console.log(res.headers);
});

//
//var OSS = require('oss-client');
//var option = {
//    accessKeyId: 'hLtdWgRPpKcj6Ezv',
//    accessKeySecret: 'uoC6D82o4VkE5mInBT8eDOsCFZCEj0'
//};
//var oss = new OSS.create(option);
//oss.putObject({
//    bucket: bucket,
//    object: object,
//    srcFile: file
//}, function(err) {
//    console.log(err);
//});