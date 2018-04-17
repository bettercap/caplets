// called when script is loaded
function onLoad() {
    console.log( "PROXY SCRIPT LOADED" );
}

// called before a request is proxied
function onRequest(req, res) {
    if( req.Path == "/test-page" ){
        for (var i = 0; i < res.Headers.length; i++) {
            res.RemoveHeader(res.Headers[i].Name);
        }
        res.SetHeader("Server", "bettercap");
        res.SetHeader("Connection", "close");
        res.Status      = 200;
        res.ContentType = "text/html";
        res.Body        = "<html>" +
                            "<head>" +
                            "<title>Test Page</title>" +
                            "</head>" +
                            "<body>" +
                                "<div align=\"center\">Hello world from bettercap!</div>" + 
                            "</body>" +
                           "</html>";
    }
}

// called after a request is proxied and there's a response
function onResponse(req, res) {
    if( res.Status == 404 ){
        for (var i = 0; i < res.Headers.length; i++) {
            res.RemoveHeader(res.Headers[i].Name);
        }
        res.SetHeader("Server", "bettercap");
        res.SetHeader("Connection", "close");
        res.ContentType = "text/html";
        res.Body        = "<html>" +
                            "<head>" +
                            "<title>Test 404 Page</title>" +
                            "</head>" +
                            "<body>" +
                                "<div align=\"center\">Custom 404 from bettercap.</div>" + 
                            "</body>" +
                           "</html>";
    }
}
