// Called before every request is executed, just override the response with 
// our own html web page.
function onRequest(req, res) {
    for (var i = 0; i < res.Headers.length; i++) {
        res.RemoveHeader(res.Headers[i].Name);
    }
    res.SetHeader("Connection", "close");
    res.Status      = 200;
    res.ContentType = "text/html";
    res.Body        =  readFile("caplets/www/index.html");
}
