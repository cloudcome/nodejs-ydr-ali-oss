# ydr-ali-oss

## ali oss for ydr.me

```
var YdrAliOss = require('ydr-ali-oss');
var oss = new YdrAliOss({
	accessKeyId: '',
	accessKeySecret: '',
	bucket: '',
	host; '',
	domain: '',
	onbeforeput: function(fileStream, next){
		next();
	}
});
```