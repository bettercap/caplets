// called when script is loaded
function onLoad() {
    console.log( "PROXY SCRIPT LOADED" );
}

// called before a request is proxied
function onRequest(req, res) {
    if( req.Path == "/test-page" ){
        headers = res.Headers.split("\r\n");
        for (var i = 0; i < headers.length; i++) {
            header_name = headers[i].replace(/:.*/, "");
            res.RemoveHeader(header_name);
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
        headers = res.Headers.split("\r\n");
        for (var i = 0; i < headers.length; i++) {
            header_name = headers[i].replace(/:.*/, "");
            res.RemoveHeader(header_name);
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
