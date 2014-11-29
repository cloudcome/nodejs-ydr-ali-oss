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
var Busboy = require('busboy');
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

    STATIC: {},

    /**
     * express 上传流中间件
     * @param req
     * @param res
     * @param next
     * @returns {*}
     */
    expressStream: function () {

        return function (req, res, next) {
            if (!(req.method === 'POST' || req.method === 'PUT')) {
                return next();
            }

            var busboy = new Busboy({
                headers: req.headers
            });

            req.uploads = [];

            // handle text field data
            busboy.on('field', function (fieldname, val, valTruncated, keyTruncated) {
                if (req.body.hasOwnProperty(fieldname)) {
                    if (Array.isArray(req.body[fieldname])) {
                        req.body[fieldname].push(val);
                    } else {
                        req.body[fieldname] = [req.body[fieldname], val];
                    }
                } else {
                    req.body[fieldname] = val;
                }
            });

            // handle files
            busboy.on('file', function (fieldName, fileStream, fileName, encoding, mimeType) {
                if (!fileName) {
                    return fileStream.resume();
                }

                var upload = {
                    fieldName: fieldName,
                    stream: fileStream,
                    fileName: fileName,
                    encoding: encoding,
                    mimeType: mimeType,
                    extname: path.extname(fileName)
                };
                req.uploads.push(upload);
                fileStream.resume();
            });

            busboy.on('finish', function () {
                next();
            });

            busboy.on('error', next);

            req.pipe(busboy);
        };
    },

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
        var headers = {
            'content-md5': '',
            'content-type': contentType
        };

        options = dato.extend(true, {}, uploadFileDefaults, options);

        var url = the._createURL(options.name || path.basename(file));

        the._cleanMeta(options);
        request.put({
            url: url,
            headers: headers
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
    accessKeyId: 'yHB6upZj7OtPa1k2',
    accessKeySecret: 'neiGkc55FJY0X0Q7cL7gL5pA3RlYvk',
    bucket: 'ydrimg',
    host: 'oss-cn-hangzhou.aliyuncs.com'
});

