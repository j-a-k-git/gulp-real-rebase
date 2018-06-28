'use strict'

var rework = require('rework');
var reworkUrl = require('rework-plugin-url');
var through = require('through2');
var fs = require('fs');
var path = require('path');

module.exports = function (mode, options) {

    var debug = options.debug;

    function realRebase(css, file) {

        //history: D:\Repos\PLM\Frontend\frontend\public\resources\style\new\jovian-icons\style.css
        //cwd: D:\Repos\PLM\Frontend\frontend
        //base: D:\Repos\PLM\Frontend\frontend\public\resources\style\new\jovian-icons\

        var rootPath = options.root || '';
        var basePath = file.base.substring(file.cwd.length);
        basePath = basePath.replace(/\\/g, '/');

        var rootIndex = basePath.indexOf(rootPath);
        rootIndex = rootIndex + rootPath.length;

        basePath = basePath.substring(rootIndex);


        var rebase = function (url, basePath) {
            var indexOfUp = url.indexOf('../');

            if (indexOfUp === 0) {
                basePath = basePath.slice(0, -1);
                var basePathFolderIndex = basePath.lastIndexOf("/") + 1;
                basePath = basePath.substring(0, basePathFolderIndex);
                url = url.substring(3);
                return rebase(url, basePath);
            }

            return { basePath: basePath, url: url };
        };

        return rework(css)
            .use(reworkUrl(function (url) {

                if (url.indexOf('data:') === 0) {
                    if (debug) {
                        console.log(`skipping : ${url} : detected inline content.`);
                    }
                    return url;
                }

                if (url.indexOf('http:') === 0 || url.indexOf('https:') === 0) {
                    if (debug) {
                        console.log(`skipping : ${url} : detected http/https content.`);
                    }
                    return url;
                }

                switch (mode) {
                    case 'rebase-abs': {

                        if (url.charAt(0) == '/') {
                            if (debug) {
                                console.log(`skipping : ${url} : detected absolute path.`);
                            }
                            return url;
                        }

                        var transformedUrls = rebase(url, basePath);
                        var retUrl = transformedUrls.basePath + transformedUrls.url;

                        if (debug) {
                            console.log(`transformed : ${url} : ${retUrl}.`);
                        }

                        return retUrl;
                    }

                    case 'rebase-copy-files': {

                    }

                    default:
                        return url;
                }
            }))
            .toString();
    };

    return through.obj(function (file, enc, cb) {

        var css = realRebase(file.contents.toString(), file);
        file.contents = new Buffer(css);

        this.push(file);
        cb();
    });
};

//console.log(`filename : ${url} : ${path.basename(retUrl)}.`);

////console.log(resolve(file.cwd + "\\public\\" + newUrl));
//var fx = resolve(file.cwd + "\\public\\" + newUrl);
//fx = fx.replace(/\\/g, '/');
//fx = fx.substring(0, fx.lastIndexOf('?'));
//console.log("fx : ", fx);

//var fName = fx.substring(fx.lastIndexOf('/') + 1);
//console.log("fName : ", fName);
//if (fs.existsSync(fx)) {
//    fs.createReadStream(fx).pipe(fs.createWriteStream('d:/' + fName));
//}

