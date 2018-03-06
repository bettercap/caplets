
function onRequest(req, res) {
    req.Path = req.Path.replace('-you-did-not-rtfm', '');
}

function onResponse(req, res) {
    if (res.ContentType.indexOf("text/html") == 0) {
        var body = res.ReadBody();
        res.Body = body.replace(
            /\.jpg/gi,
          '-you-did-not-rtfm.jpg'
        );
    }
    else if (res.ContentType.indexOf("image/jpeg") != -1) {
        res.Status  = 200;
        res.Headers = "Connection: close";
        res.Body    = readFile("caplets/www/rtfm_cat.jpg");
        log("RTFM! " + req.Hostname + req.Path + ( req.Query ? "?" + req.Query : ''));
    }
}