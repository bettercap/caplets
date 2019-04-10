var RESET = "\033[0m";

function R(s) {
    return "\033[31m" + s + RESET;
}

function G(s) {
    return "\033[32m" + s + RESET;
}

function B(s) {
    return "\033[34m" + s + RESET;
}

function Y(s) {
    return "\033[33m" + s + RESET;
}

function BLACK_BLUE(s) {
    return "\033[104;30m" + s + RESET;
}

function BLACK_RED(s) {
    return "\033[41;30m" + s + RESET;
}

function DIM(s) {
    return "\033[2m" + s + RESET;
}

function GREY(s) {
    return "\033[30m" + s + RESET;
}

function BOLD(s) {
    return "\033[1m" + s + RESET;
}

function dumpHeaders(req) {
    headers = req.Headers.replace(/\r\n$/g, "").split("\r\n");

    msg = "\n  " + BOLD("Headers") + "\n\n";

    for (var i = 0; i < headers.length; i++) {
        header_name = headers[i].replace(/:.*/, "");
        header_value = headers[i].replace(/.*?: /, "");

        msg += "    " + G(header_name) + " => " + BOLD(header_value) + "\n";
    }

    console.log(msg);
}

function dumpPlain(req) {
    body = req.ReadBody();

    if (req.Body.length > 0) {
        console.log("  " + BOLD("Text") + "\n\n    " + Y(body) + "\n");
    }
}

function dumpForm(req) {
    form = req.ParseForm();

    if (Object.keys(form).length > 0) {
        msg = "  " + BOLD("Form") + "\n\n";

        for (var key in form) {
            msg += "    " + B(strip(key)) + " : " + Y(strip(form[key])) + "\n";
        }

        console.log(msg);
    }
}

function dumpQuery(req) {
    params = req.Query.split("&");

    msg = "  " + BOLD("Query") + "\n\n";

    for (var i = 0; i < params.length; i++) {
        param_name = params[i].split("=")[0];
        param_value = params[i].split("=")[1];

        if (param_name != undefined && param_value != undefined && param_name.length > 0 && param_value.length > 0) {
            try {
                msg += "    " + B(strip(decodeURIComponent(param_name))) + " : " + Y(strip(decodeURIComponent(param_value))) + "\n";
            } catch(err) {
                msg += "    " + B(strip(param_name)) + " : " + Y(strip(param_value)) + "\n";
                log_debug("could not decode URI parameter: " + err);
            }
        } else {
            if (params[i].length > 0) {
                try {
                    msg += "    " + Y(strip(decodeURIComponent(params[i]))) + "\n";
                } catch(err) {
                    msg += "    " + Y(strip(params[i])) + "\n";
                    log_debug("could not decode URI parameter: " + err);
                }
            }
        }
    }

    console.log(msg);
}

function dumpJSON(req) {
    msg = "  " + BOLD("JSON") + "\n\n";

    var body = req.ReadBody();

    if (req.Body.length > 0) {
        try {
            json = JSON.parse(body);
            json_msg = JSON.stringify(json, null, 4);

            msg_lines = json_msg.split("\n");

            for (var i = 0; i < msg_lines.length; i++) {
                msg += "    " + msg_lines[i].replace(/^(\s*)\{$/,                  "$1" + B("{"))
                                            .replace(/^(\s*)\[$/,                  "$1" + B("["))
                                            .replace(/^(\s*)(".*?"): \{$/,         "$1" + B("$2") + ": " + B("{"))
                                            .replace(/^(\s*)(".*?"): \[$/,         "$1" + B("$2") + ": " + B("["))
                                            .replace(/^(\s*)(".*?"): (.*?)(,$|$)/, "$1" + B("$2") + ": " + Y("$3") + "$4")
                                            .replace(/^(\s*)(".*?")(,$|$)/,        "$1" + Y("$2") + "$3")
                                            .replace(/^(\s*)(\d*?)(,$|$)/,         "$1" + Y("$2") + "$3")
                                            .replace(/^(\s*)\](,$|$)/,             "$1" + B("]") + "$2")
                                            .replace(/^(\s*)\}(,$|$)/,             "$1" + B("}") + "$2") + "\n";
            }
        } catch(ignore) {
            msg += "    " + Y(body) + "\n";
        }

        console.log(msg);
    }
}

function dumpHex(raw) {
    var DataSize = raw.length;
    var Bytes = 16;

    msg = "";

    for (var address = 0; address < DataSize; address++) {
        var saddr = pad(address, 8, "0");
        var shex = "";
        var sprint = "";

        var end = address + Bytes;
        for (var i = address; i < end; i++) {
            if (i < DataSize) {
                shex += toHex(raw.charCodeAt(i)) + " ";
                sprint += isPrint(raw[i]) ? raw[i] : ".";
            } else {
                shex += "   ";
                sprint += " ";
            }
        }

        address = end;

        msg += "    " + G(saddr) + "  " + shex + " " + sprint + "\n";
    }

    console.log(msg);
}

function dumpRaw(req) {
    var body = req.ReadBody();

    if (body.length > 0) {
        console.log("  " + BOLD("Body") + " " + DIM("(" + body.length + " bytes)") + "\n");

        dumpHex(body);
    }
}

function pad(num, size, fill) {
    var s = "" + num;

    while (s.length < size) {
        s = fill + s;
    }

    return s;
}

function strip(s) {
    return s.replace(/^\s*/, "").replace(/\s*$/, "");
}

function toHex(n) {
    var hex = "0123456789abcdef";
    var h = hex[(0xF0 & n) >> 4] + hex[0x0F & n];
    return pad(h, 2, "0");
}

function isPrint(c) {
    if (!c) { return false; }
    var code = c.charCodeAt(0);
    return (code > 31) && (code < 127);
}

function onRequest(req, res) {
    log("[" + G("http-req-dump") + "] " + BLACK_RED(req.Scheme) + " " + req.Client.IP + " " + BLACK_BLUE(req.Method) + " " + GREY(req.Scheme + "://") + Y(req.Hostname) + req.Path + (req.Query != "" ? GREY("?" + req.Query) : ""));

    dumpHeaders(req);

    if (req.Query.length > 0) {
        dumpQuery(req);
    }

    if (req.ContentType.indexOf("text/plain") != -1) {
        dumpPlain(req);
    } else if (req.ContentType.indexOf("application/x-www-form-urlencoded") != -1) {
        dumpForm(req);
    } else if (req.ContentType.indexOf("application/json") != -1) {
        dumpJSON(req);
    } else {
        dumpRaw(req);
    }
}
