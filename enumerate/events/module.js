var red    = "\033[31m",
    yellow = "\033[33m",
    green  = "\033[32m",
    bold   = "\033[1;37m",
    reset  = "\033[0m"

function configure() {
	if ( !readFile( env("events.stream.output") ) ) {
		log_error("Error: " + bold + "events.stream.output" + reset + " file not found (got " + env("events.stream.output") + ")")
	}
}

function onCommand(cmd) {
	if (cmd == "enumerate.events.all") {
		console.log( readFile( env("events.stream.output") ) )
		return true
	}
	if ( cmd.match(/^enumerate\.events\.regexp ./) ) {
		regexp = new RegExp( cmd.replace("enumerate.events.regexp ", "") )
		saved_events = readFile( env("events.stream.output") ).split("\n")
		found_events = []
		for (var i = 0; i < saved_events.length; i++) {
			saved_events[i].match(regexp) ? found_events.push(saved_events[i]) : ""
		}
		console.log( found_events.join("\n") )
		return true
	}
}

function onLoad() {
	console.log("\n" + bold + "  Commands" + reset + "\n")
	console.log("       " + yellow + "enumerate.events.all" + reset + " : Enumerate all events.")
	console.log("    " + yellow + "enumerate.events.regexp" + reset + " : Enumerate events with regexp value.\n")
	configure()
	log_info("(" + green + "enumerate.events" + reset + ") Module successfully loaded.")
}
