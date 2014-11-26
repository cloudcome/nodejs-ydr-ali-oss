/*!
 * 认证
 * @author ydr.me
 * @create 2014-11-26 23:32
 */

'use strict';

var dato = require('ydr-util').dato;
var crypto = require('crypto');
var REG_HTTP = /^http:\//i;

/**
 * get author header
 *
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
 * @return {Object}
 */
module.exports = function (options, headers) {
    var auth = 'OSS ' + options.accessKeyId + ':';
    var date = new Date().toUTCString();
    var params = [
        options.method.toUpperCase(),
        headers['Content-MD5'],
        headers['Content-Type'],
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
