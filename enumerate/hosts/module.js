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
			host = logs[i].replace(/.*\033\[33m(https:\/\/|)(.*?)\033\[0m.*/g, "$2")
			extracted_hosts.indexOf(host) == -1 ? extracted_hosts.push(host) : ""
		}
	}

	return extracted_hosts
}

function compareHosts(old_hosts, new_hosts) {
	difference = []

	for (var i = 0; i < new_hosts.length; i++) {
		old_hosts.indexOf(new_hosts[i]) == -1 ? difference.push(new_hosts[i]) : ""
	}

	return difference
}

function saveHosts(new_hosts) {
	saved_hosts = readFile( env("enumerate.hosts.output") ).split("\n")

	for (var i = 0; i < new_hosts.length; i++) {
		saved_hosts.indexOf(new_hosts[i]) == -1 ? saved_hosts.push(new_hosts[i]) : ""
	}

	writeFile( env("enumerate.hosts.output"), saved_hosts.join("\n") )
}

function printHosts(hosts) {
	if (hosts.length != 0) {
		log_string = ""

		for (var i = 0; i < hosts.length; i++) {
			log_string += "  " + yellow + hosts[i] + reset + "\n"
			enumerated_hosts.indexOf(hosts[i]) == -1 ? enumerated_hosts.push(hosts[i]) : ""
		}

		console.log("\n" + log_string)
	} else {
		console.log("\n  No hosts to display.\n")
	}
}

function onCommand(cmd) {
	if (cmd == "enumerate.hosts.all") {
		saved_hosts = readFile( env("enumerate.hosts.output") ).split("\n")
		printHosts(saved_hosts)
		return true
	}

	if (cmd == "enumerate.hosts.new") {
		new_hosts = compareHosts( enumerated_hosts, extractHosts() )
		printHosts(new_hosts)
		return true
	}

	if ( cmd.match(/^enumerate\.hosts\.regexp ./) ) {
		regexp = new RegExp( cmd.replace("enumerate.hosts.regexp ", "") )
		saved_hosts = readFile( env("enumerate.hosts.output") ).split("\n")
		found_hosts = []

		for (var i = 0; i < saved_hosts.length; i++) {
			saved_hosts[i].match(regexp) ? found_hosts.push(saved_hosts[i]) : ""
		}

		printHosts(found_hosts)
		return true
	}

	if (cmd == "enumerate.hosts.save") {
		saveHosts( extractHosts() )
		return true
	}
}

function onLoad() {
	console.log("\n" + bold + "  Commands" + reset + "\n")
	console.log("       " + yellow + "enumerate.hosts.all" + reset + " : Enumerate all hosts.")
	console.log("       " + yellow + "enumerate.hosts.new" + reset + " : Enumerate new hosts.")
	console.log("    " + yellow + "enumerate.hosts.regexp" + reset + " : Enumerate hosts with regexp value.\n")
	configure()
	log_info("(" + green + "enumerate.hosts" + reset + ") Module successfully loaded.")
}
