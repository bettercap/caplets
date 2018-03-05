
function onRequest(req, res) {
    // clear caching headers
    for( var i = 0; i < req.Headers.length; ) {
        var header = req.Headers[i];
        if (header.Name == "If-Modified-Since" || header.Name == "If-None-Match") {
            req.Headers.splice(i, 1);
        }
        else {
            i++;
        }
    }
}

function onResponse(req, res) {
    if (res.ContentType.indexOf("image/jpeg") != -1) {
        res.Status  = 200;
        res.Headers = "Connection: close";
        res.Body    = readFile("caplets/www/rtfm_cat.jpg");
        log("RTFM! " + req.Hostname + req.Path + ( req.Query ? "?" + req.Query : ''));
    }
}