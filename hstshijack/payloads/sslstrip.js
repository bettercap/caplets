setInterval(function(){
	document.querySelectorAll("a").forEach(function(a){
		a.href = a.href.replace(/https\:\/\//ig, "http://")
	})
}, 666)
