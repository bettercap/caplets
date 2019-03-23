function onLoad() {
    log("TCP module loaded")
}

function onData(from, to, data) {
    if( data.indexOf("Accept-Encoding: gzip, deflate") != -1 ) {
        log("Disabling gzip response");
        data = data.replace("Accept-Encoding: gzip, deflate", "Accept-Encoding: text/plain");
        return data;
    }

    return data.replace(/Example/g, "POPOPOP");
}
