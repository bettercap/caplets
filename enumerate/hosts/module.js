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
	} else {
		enumerated_hosts = readFile( env("enumerate.hosts.output") ).split("\n")
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
	enumerated_hosts = saved_hosts
}

function onCommand(cmd) {
	if (cmd == "enumerate.hosts.all") {
		saveHosts()
		console.log()
		for (var i = 0; i < enumerated_hosts.length; i++) {
			console.log("  " + yellow + enumerated_hosts[i] + reset)
		}
		console.log()
		return true
	}
	if (cmd == "enumerate.hosts.new") {
		new_hosts = extractHosts()
		console.log()
		for (var i = 0; i < new_hosts.length; i++) {
			enumerated_hosts.indexOf(new_hosts[i]) == -1 ? console.log("  " + yellow + new_hosts[i] + reset) : ""
		}
		console.log()
		saveHosts()
		return true
	}
}

function onLoad() {
	console.log("\n" + bold + "  Commands" + reset + "\n")
	console.log("    " + yellow + "enumerate.hosts.all" + reset + " : Enumerate all hosts.")
	console.log("    " + yellow + "enumerate.hosts.new" + reset + " : Enumerate new hosts.\n")
	configure()
	log_info("(" + green + "enumerate.hosts" + reset + ") Module successfully loaded.")
}

function onRequest(req, res) {
	saveHosts()
}
