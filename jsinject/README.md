### JS-INJECT

A simple yet powerful proxy module that lets you inject your JavaScript payloads into any HTTP web page/application.

It prevents re-initiation of your script when it's already active in the DOM by declaring your payload as a unique function variable, and in some cases ignores the `X-Content-Type-Options: nosniff` header by checking for both `Content-Type` headers and file extensions.

All you have to do is set your payload path in the caplet file.

**jsinject/jsinject.cap**

```sh
# Set the path to your JavaScript payload
set jsinject.payload jsinject/payloads/form-phisher.js

set http.proxy.script jsinject/jsinject.js
set net.sniff.verbose false
net.sniff on
http.proxy on
```

<hr>

### Included payload

<b><a href="./payloads/form-phisher.js">form-phisher.js</a></b> is included, which will wait for the victim to press a key before binding to the enter key, mouse click, screen tap and submit events in order to phish all the fields. This can be useful when you want to sniff proxied forms that are submitted over HTTPS, don't use URL parameters, etc. 
