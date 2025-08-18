function onLoad() {
    log("TCP module loaded")
}

function charToInt(value) { 
    return value.charCodeAt()
}


function onData(from, to, data) {
    //log(data) // 104 101 108 108 111
    st_data = String.fromCharCode.apply(null, data)
    log("TCP req dump String data: " + st_data) // "hello"
  
    if( st_data.indexOf("Accept-Encoding: gzip, deflate") != -1 ) {
        log("Disabling gzip response");
        st_data = st_data.replace("Accept-Encoding: gzip, deflate", "Accept-Encoding: text/plain");
        res_int_arr = st_data.split("").map(charToInt)
        return res_int_arr
    }
    return data
}
