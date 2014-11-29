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
var crypto = require('crypto');
var mime = require('ydr-util').mime;
var xmlParse = require('xml2js').parseString;
var howdo = require('howdo');
var imagesize = require('imagesize');
var REG_META = /^x-oss-meta-/i;
var REG_TITLE = /<title>([\s\S]*?)<\/title>/;
var constructorDefaults = {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    host: 'oss-cn-hangzhou.aliyuncs.com'
};
var uploadDefaults = {
    expires: 365 * 24 * 60 * 60 * 1000,
    cacheControl: 'public',
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

    STATIC: {
        /**
         * express 中间件
         * @param req
         * @param res
         * @param next
         * @returns {*}
         * @private
         */
        __express: function (req, res, next) {
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
            busboy.on('file', function (fieldName, fileStream, fileName, encoding, contentType) {
                if (!fileName) {
                    return fileStream.resume();
                }

                var upload = {
                    fieldName: fieldName,
                    body: fileStream,
                    fileName: fileName,
                    encoding: encoding,
                    contentType: contentType,
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
        }
    },



    /**
     * 上传文件
     * @param options
     * @param [options.expires=31536000000] 1年 365*24*60*60*1000，单位ms
     * @param [options.cacheControl='public'] 缓存策略
     * @param [options.meta=null] meta
     * @param [options.object=null] 文件名称
     * @param [options.contentType=null] 内容类型
     * @param [options.file=null] 上传文件【优先级1】
     * @param [options.body=null] 上传流【优先级2】
     * @param callback
     */
    upload: function (options, callback) {
        var the = this;
        var date = new Date();

        options = dato.extend(false, {}, uploadDefaults, options);
        the._cleanMeta(options);

        var headers = {
            date: date.toUTCString(),
            expires: new Date(date.getTime() + options.expires).toUTCString(),
            'content-type': options.contentType,
            'content-md5': '',
            'cache-control': options.cacheControl
        };

        dato.each(options.meta, function (key, val) {
            headers['x-oss-meta-' + key] = val;
        });

        options.url = this._createURL(options.object);
        this._sign('put', options.object, headers);
        options.headers = headers;

        if (options.file) {
            try {
                options.body = fs.createReadStream(file);
            } catch (err) {
                return callback(err);
            }
        }

        howdo
            .task(function (done) {
                imagesize(options.body, function (err, ret) {
                    if (err) {
                        return done(null, {
                            image: false
                        });
                    }

                    done(null, {
                        image: true,
                        type: ret.format,
                        width: ret.width,
                        height: ret.height
                    });
                });
            })
            .task(function (done) {
                request.put(options, function (err, body, res) {
                    if (err) {
                        return done(err);
                    }

                    if (res.statusCode === 200) {
                        return done(null, {
                            url: options.url
                        });
                    }

                    xmlParse(body, function (err, ret) {
                        var msg = '';

                        if (err) {
                            msg = (body.match(REG_TITLE) || ['', ''])[1];

                            return done(new Error(msg || 'parse upload result error'));
                        }

                        msg = ret && ret.Error && ret.Error.Message;
                        msg = typeis(msg) === 'array' ? msg[0] : msg;
                        done(new Error(msg));
                    });
                });
            })
            .together(function (err, retSize, retReq) {
                if (err) {
                    return callback(err);
                }

                callback(err, dato.extend(retSize, retReq));
            });
    },


    /**
     * 头信息签名
     * @param method
     * @param object
     * @param headers
     * @param headers['conten-type']
     * @param headers['conten-length']
     * @param headers['date']
     * @private
     */
    _sign: function (method, object, headers) {
        var options = dato.extend(true, {}, this._options, {
            method: method,
            object: object
        });
        var auth = 'OSS ' + options.accessKeyId + ':';
        var date = options.date || new Date().toUTCString();
        var params = [
            options.method.toUpperCase(),
            headers['content-md5'],
            headers['content-type'],
            date
        ];
        var resource = '/' + options.bucket + options.object;
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

        return dato.extend(true, headers, {
            Authorization: auth + signature,
            Date: date
        });
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

//var oss = new module.exports({
//    accessKeyId: 'xxxxxxxxxxxx',
//    accessKeySecret: 'xxxxxxxxxxxxxxxxxxxxxxxx',
//    bucket: 'ydrimg',
//    host: 'oss-cn-hangzhou.aliyuncs.com'
//});
//
//var fs = require('fs');
//var path = require('path');
//var typeis = require('ydr-util').typeis;
//var file = path.join(__dirname, './test/x.png');
//var stream = fs.createReadStream(file);
//var Stream = require('stream');
//
//oss.upload({
//    object: '/x/x.png',
//    contentType: 'image/png',
//    body: stream
//}, function (err, ret) {
//    console.log(err);
//    console.log(ret);
//});