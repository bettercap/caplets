// Called before every request is executed, just override the response with 
// our own html web page.
function onRequest(req, res) {
    headers = res.Headers.split("\r\n");
    for (var i = 0; i < headers.length; i++) {
        header_name = headers[i].replace(/:.*/, "");
        res.RemoveHeader(header_name);
    }
    res.SetHeader("Connection", "close");
    res.Status      = 200;
    res.ContentType = "text/html";
    res.Body        =  readFile("/usr/local/share/bettercap/caplets/www/index.html");
}
