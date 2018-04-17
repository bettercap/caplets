
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
        for (var i = 0; i < res.Headers.length; i++) {
            res.RemoveHeader(res.Headers[i].Name);
        }
        res.SetHeader("Connection", "close");
        res.Status  = 200;
        res.Body    = readFile("caplets/www/rtfm_cat.jpg");
        log("RTFM! " + req.Hostname + req.Path + ( req.Query ? "?" + req.Query : ''));
    }
}
