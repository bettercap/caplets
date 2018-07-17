var enumerated_hosts = []

var red    = "\033[31m",
    yellow = "\033[33m",
    green  = "\033[32m",
    bold   = "\033[1;37m",
    reset  = "\033[0m"

function configure() {
	if ( !readFile( env("enumerate.hosts.output") ) ) {
		log_info("(" + green + "enumerate.hosts" + reset + ") " + bold + "enumerate.hosts.output" + reset + " file was not found, creating one ...")
		writeFile( env("enumerate.hosts.output"), "" )
	}
	if ( !readFile( env("events.stream.output") ) ) {
		log_error("Error: " + bold + "events.stream.output" + reset + " file not found (got " + env("events.stream.output") + ")")
	}
}

function extractHosts() {
	data = readFile( env("events.stream.output") )
	all_hosts = data.replace(/.*\033\[33m(https:\/\/|)/g, "").replace(/\033\[0m.*/g, "").replace(/ .*/g, "").replace(/\[.*\].*\n/g, "").split("\n")
	individual_hosts = []
	for (var i = 0; i < all_hosts.length; i++) {
		individual_hosts.indexOf(all_hosts[i]) == -1 ? individual_hosts.push(all_hosts[i]) : ""
	}
	return individual_hosts
}

function saveHosts(hosts) {
	data = hosts.join("\n")
	writeFile( env("enumerate.hosts.output"), data )
}

function onCommand(cmd) {
	if (cmd == "enumerate.hosts.all") {
		enumerated_hosts = extractHosts()
		console.log()
		for (var i = 0; i < enumerated_hosts.length; i++) {
			console.log("  " + yellow + enumerated_hosts[i] + reset)
		}
		console.log()
		saveHosts( extractHosts() )
	}
	if (cmd == "enumerate.hosts.new") {
		all_hosts = extractHosts()
		console.log()
		for (var i = 0; i < all_hosts.length; i++) {
			enumerated_hosts.indexOf(all_hosts[i]) == -1 ? console.log(yellow + all_hosts[i] + reset) : ""
		}
		console.log()
		enumerated_hosts = all_hosts
		saveHosts( extractHosts() )
	}
}

function onLoad() {
	console.log("\n" + bold + "  Commands" + reset + "\n")
	console.log("    " + yellow + "enumerate.hosts.all" + reset + " : List all enumerated hosts of this session.")
	console.log("    " + yellow + "enumerate.hosts.new" + reset + " : List enumerated hosts of this session that were not listed yet.\n")
	configure()
	log_info("(" + green + "enumerate.hosts" + reset + ") Module successfully loaded.")
}

function onRequest(req, res) {
	saveHosts( extractHosts() )
}
