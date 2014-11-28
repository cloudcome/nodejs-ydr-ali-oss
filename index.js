/*!
 * 文件描述
 * @author ydr.me
 * @create 2014-11-27 21:47
 */

'use strict';

var path = require('path');
var klass = require('ydr-util').class;
var dato = require('ydr-util').dato;
var typeis = require('ydr-util').typeis;
var request = require('ydr-util').request;
var request2 = require('request');
var crypto = require('ydr-util').crypto;
var mime = require('ydr-util').mime;
var auth = require('./libs/auth.js');
var REG_META = /^x-oss-meta-/i;
var constructorDefaults = {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    host: 'oss-cn-hangzhou.aliyuncs.com'
};
var uploadFileDefaults = {
    expires: 365 * 24 * 60 * 60 * 1000,
    cache: 'public',
    // 不需要写 x-oss-meta- 前缀
    meta: null
};
var uploadStreamDefaults = {
    expires: 365 * 24 * 60 * 60 * 1000,
    cache: 'public',
    // 必填
    length: null,
    // 不需要写 x-oss-meta- 前缀
    meta: null
};

module.exports = klass.create({
    /**
     * 实例化一个 oss 服务
     * @param options
     * @param options.accessKeyId {String}
     * @param options.accessKeySecret {String}
     * @param options.bucket {String}
     * @param [options.host] {String}
     */
    constructor: function (options) {
        this._options = dato.extend(true, {}, constructorDefaults, options);
    },


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



    /**
     * 文件上传
     * @param file
     * @param options
     * @param [options.expires] 1年 365*24*60*60*1000
     * @param [options.cache='public']
     * @param [options.meta=null]
     * @param [options.name=null] 默认为文件名称
     * @param callback
     */
    uploadFile: function (file, options, callback) {
        var the = this;
        var extname = path.extname(file);
        var contentType = mime.get(extname);

        options = dato.extend(true, {}, uploadFileDefaults, options);

        var url = the._createURL(options.name || path.basename(file));

        the._cleanMeta(options);
        request.put(url, {
            headers: {}
        });
    },


    /**
     * 流文件
     * @param file
     * @param options
     * @param [options.expires] 1年 365*24*60*60*1000
     * @param [options.cache='public']
     * @param [options.meta=null]
     * @param options.length
     * @param callback
     */
    uploadStream: function (file, options, callback) {
        var the = this;

        options = dato.extend(true, {}, uploadStreamDefaults, options);

        if (typeis(options.length) !== 'number') {
            return callback(new Error('options.length must be a number'));
        }

        if (options.length < 0) {
            return callback(new Error('options.length must be great than 0'));
        }

        the._cleanMeta(options);
    },


    /**
     * 配置跨域
     * @param rules {Array|Object} 单个或多个规则
     * @param callback {Function}
     */
    setCrosRule: function (rules, callback) {
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        var url = this._createURL() + '/?cors';
        var hasError = false;

        xml += '<CORSConfiguration>\n';

        if (typeis(rules) !== 'array') {
            rules = [rules];
        }

        dato.each(rules, function (i, rule) {
            if (!(rule && rule.AllowedOrigin && rule.AllowedMethod)) {
                callback(new Error('rule.AllowedOrigin OR rule.AllowedMethod must exist'));
                hasError = true;
                return false;
            }

            xml += '  <CORSRule>\n';

            if (rule.AllowedOrigin) {
                if (typeis(rule.AllowedOrigin) !== 'array') {
                    rule.AllowedOrigin = [rule.AllowedOrigin];
                }

                dato.each(rule.AllowedOrigin, function (j, origin) {
                    xml += '     <AllowedOrigin>' + origin + '</AllowedOrigin>\n';
                });
            }

            if (rule.AllowedMethod) {
                if (typeis(rule.AllowedMethod) !== 'array') {
                    rule.AllowedMethod = [rule.AllowedMethod];
                }

                dato.each(rule.AllowedMethod, function (j, method) {
                    xml += '     <AllowedMethod>' + method.toUpperCase() + '</AllowedMethod>\n';
                });
            }

            if (rule.AllowedHeader) {
                if (typeis(rule.AllowedHeader) !== 'array') {
                    rule.AllowedHeader = [rule.AllowedHeader];
                }

                dato.each(rule.AllowedHeader, function (j, header) {
                    xml += '     <AllowedHeader>' + header + '</AllowedHeader>\n';
                });
            }

            if (rule.ExposeHeader) {
                if (typeis(rule.ExposeHeader) !== 'array') {
                    rule.ExposeHeader = [rule.ExposeHeader];
                }

                dato.each(rule.ExposeHeader, function (j, header) {
                    xml += '     <ExposeHeader>' + header + '</ExposeHeader>\n';
                });
            }

            if (rule.MaxAgeSeconds) {
                xml += '     <MaxAgeSeconds>' + rule.MaxAgeSeconds + '</MaxAgeSeconds>\n';
            }

            xml += '  </CORSRule>\n';
        });

        if (hasError) {
            return;
        }

        xml += '</CORSConfiguration>\n';

        var options = dato.extend({}, this._options, {
            object: '',
            method: 'put'
        });
        var headers = {
            Host: this._options.bucket + '.' + this._options.host,
            'Content-Md5': crypto.md5(xml),
            'Content-Type': 'application/xml',
            'Content-Length': xml.length
        };
        this._sign(options, headers);

        console.log(url);
        console.log(options);
        console.log(headers);
        console.log(xml);
        request.put(url, {
            body: xml,
            headers: headers
        }, callback);
    },


    /**
     * 头信息签名
     * @param options
     * @param headers
     * @param headers['conten-type']
     * @param headers['conten-length']
     * @param headers['date']
     * @private
     */
    _sign: function (options, headers) {
        var authHeaders = auth(options, headers);

        dato.extend(true, headers, authHeaders);
    },


    /**
     * 清理 meta
     * @private
     */
    _cleanMeta: function (options) {
        var meta = {};

        dato.each(options.meta, function (key, val) {
            meta[key.replace(REG_META, '')] = val;
        });

        options.meta = meta;
    },


    /**
     * 生成访问URL
     * @param [object]
     * @returns {string}
     * @private
     */
    _createURL: function (object) {
        return 'http://' + this._options.bucket + '.' + this._options.host +
            (object ? object : '');
    }
});

var oss = new module.exports({
    accessKeyId: '',
    accessKeySecret: '',
    bucket: 'ydrimg',
    host: 'oss-cn-hangzhou.aliyuncs.com'
});

oss.setCrosRule({
    AllowedOrigin: '*',
    AllowedMethod: 'get'
}, function (err, body) {
    console.log(err);
    console.log(body);
});