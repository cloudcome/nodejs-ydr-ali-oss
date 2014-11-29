/*!
 * 认证
 * @author ydr.me
 * @create 2014-11-26 23:32
 */


'use strict';

var dato = require('ydr-util').dato;
var crypto = require('crypto');

/**
 * "Authorization: OSS " + Access Key Id + ":" + Signature
 *
 * Signature = base64(hmac-sha1(Access Key Secret + "\n"
 *  + VERB + "\n"
 *  + CONTENT-MD5 + "\n"
 *  + CONTENT-TYPE + "\n"
 *  + DATE + "\n"
 *  + CanonicalizedOSSHeaders
 *  + CanonicalizedResource))
 *
 * @param {Object} options
 * @param {String} options.accessKeyId
 * @param {String} options.accessKeySecret
 * @param {String} options.bucket
 * @param {String} options.object
 * @param {String} options.method
 * @param {Object} headers 请求头
 * @param {String} [headers.Date] 请求时间
 * @param {String} headers['Content-Md5'] 请求内容的 MD5
 * @param {String} headers['Content-Type'] 请求内容的类型
 * @return {Object}
 */
module.exports = function (options, headers) {
    var auth = 'OSS ' + options.accessKeyId + ':';
    var date = headers.Date || new Date().toUTCString();
    var params = [
        options.method.toUpperCase(),
        headers['content-md5'],
        headers['content-type'],
        date
    ];
    var resource = '/' + options.bucket + '/' + options.object;
    var ossHeaders = {};
    var signature;

    dato.each(headers, function (key, val) {
        var lkey = key.toLowerCase().trim();
        if (lkey.indexOf('x-oss-') === 0) {
            ossHeaders[lkey] = ossHeaders[lkey] || [];
            ossHeaders[lkey].push(val.trim());
        }
    });

    Object.keys(ossHeaders).sort().forEach(function (key) {
        params.push(key + ':' + ossHeaders[key].join(','));
    });

    params.push(resource);
    signature = crypto.createHmac('sha1', options.accessKeySecret);
    signature = signature.update(params.join('\n')).digest('base64');

    return {
        Authorization: auth + signature,
        Date: date
    };
};

//PUT /nelson HTTP/1.0
//Content-Md5: ODBGOERFMDMzQTczRUY3NUE3NzA5QzdFNUYzMDQxNEM=
//Content-Type: text/html
//Date: Thu, 17 Nov 2005 18:49:58 GMT
//Host: oss-example.oss-cn-hangzhou.aliyuncs.com
//X-OSS-Meta-Author: foo@bar.com
//X-OSS-Magic: abracadabra

// Authorization:OSS 44CF9590006BF252F707: 26NBxoKdsyly4EDv6inkoDft/yA=

//{ Authorization: 'OSS 44CF9590006BF252F707:26NBxoKdsyly4EDv6inkoDft/yA=',
//    Date: 'Thu, 17 Nov 2005 18:49:58 GMT' }

//var  a = module.exports({
//    method: 'PUT',
//    accessKeyId: '44CF9590006BF252F707',
//    accessKeySecret: 'OtxrzxIsfpFjA7SwPzILwy8Bw21TLhquhboDYROV',
//    bucket: 'oss-example',
//    object: 'nelson'
//}, {
//    'content-md5':'ODBGOERFMDMzQTczRUY3NUE3NzA5QzdFNUYzMDQxNEM=',
//    'content-type': 'text/html',
//    date: 'Thu, 17 Nov 2005 18:49:58 GMT',
//    host: 'oss-example.oss-cn-hangzhou.aliyuncs.com',
//    'x-oss-meta-author': 'foo@bar.com',
//    'x-oss-magic': 'abracadabra'
//});
//console.log(a);
