/*!
 * 认证
 * @author ydr.me
 * @create 2014-11-26 23:32
 */

//在put object或者copy的时候都可以自定义head的。
//java版本示例 public void putObject(String bucketName, String key, String filePath)
//throws FileNotFoundException {
// 初始化OSSClient OSSClient client = ...;
// 获取指定文件的输入流 File file = new File(filePath);
// InputStream content = new FileInputStream(file);
// 创建上传Object的Metadata ObjectMetadata meta = new ObjectMetadata();
// meta.addUserMetadata("Access-Control-Allow-Origin","*");
// 必须设置ContentLength meta.setContentLength(file.length());
// 上传Object. PutObjectResult result = client.putObject(bucketName, key, content, meta);
// 打印ETag System.out.println(result.getETag());}
// meta.addUserMetadata 中就可以增加Access-Control-Allow-Origin的设置。

'use strict';

var dato = require('ydr-util').dato;
var crypto = require('crypto');

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
