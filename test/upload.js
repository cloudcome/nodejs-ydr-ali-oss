/*!
 * 文件描述
 * @author ydr.me
 * @create 2014-11-26 23:28
 */

'use strict';


var express = require('express');
var app = express();

app.listen(18085);

app.get('/', function (req, res, next) {
    res.sendFile();
});