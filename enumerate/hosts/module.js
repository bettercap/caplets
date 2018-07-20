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
	logs = readFile( env("events.stream.output") ).split("\n")
	extracted_hosts = []
	for (var i = 0; i < logs.length; i++) {
		if ( logs[i].match(/\[.*?net\.sniff.*?\]/i) ) {
			host = logs[i].replace(/.*\033\[33m(https:\/\/|)/g, "").replace(/\033\[0m.*/g, "").replace(/ .*/g, "")
			extracted_hosts.indexOf(host) == -1 ? extracted_hosts.push(host) : ""
		}
	}
	return extracted_hosts
}

function saveHosts() {
	saved_hosts = readFile( env("enumerate.hosts.output") ).split("\n")
	all_hosts = extractHosts()
	for (var i = 0; i < all_hosts.length; i++) {
		saved_hosts.indexOf(all_hosts[i]) == -1 ? saved_hosts.push(all_hosts[i]) : ""
	}
	writeFile( env("enumerate.hosts.output"), saved_hosts.join("\n") )
}

function onCommand(cmd) {
	if (cmd == "enumerate.hosts.all") {
		enumerated_hosts = extractHosts()
		console.log()
		for (var i = 0; i < enumerated_hosts.length; i++) {
			console.log("  " + yellow + enumerated_hosts[i] + reset)
		}
		console.log()
		saveHosts()
	}
	if (cmd == "enumerate.hosts.new") {
		all_hosts = extractHosts()
		console.log()
		for (var i = 0; i < all_hosts.length; i++) {
			enumerated_hosts.indexOf(all_hosts[i]) == -1 ? console.log("  " + yellow + all_hosts[i] + reset) : ""
		}
		console.log()
		enumerated_hosts = all_hosts
		saveHosts()
	}
}

function onLoad() {
	console.log("\n" + bold + "  Commands" + reset + "\n")
	console.log("    " + yellow + "enumerate.hosts.all" + reset + " : List all enumerated hosts.")
	console.log("    " + yellow + "enumerate.hosts.new" + reset + " : List enumerated hosts that were not yet listed in this session.\n")
	configure()
	log_info("(" + green + "enumerate.hosts" + reset + ") Module successfully loaded.")
}

function onRequest(req, res) {
	saveHosts()
}
