const obf_func_attack_8528027 = async () => {
	try {
		document.querySelectorAll("div.rc div.r a").forEach(async(obf_a_8528027)=>{
			obf_a_8528027.onmousedown = function(){};
			obf_a_8528027.onclick = function(){};
			obf_a_8528027.href = obf_a_8528027.href.replace(/(?:.*url[?]q=|url=)/ig, "").replace(/&.*/g, "").replace(/(http)[s]?:\/\//ig, "$1://");
		});
	} catch(obf_var_ignore_8528027){}
}

obf_func_attack_8528027();

setInterval(obf_func_attack_8528027, 666);

try {
	document.addEventListener("DOMContentLoaded", obf_func_attack_8528027);
} catch(obf_var_ignore_8528027) {
	self.addEventListener("load", obf_func_attack_8528027);
}
