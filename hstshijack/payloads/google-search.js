globalThis.addEventListener("DOMContentLoaded", function(){
  "use strict";

  if (location.pathname === "/search") {
    document.querySelectorAll("a").forEach(function(obf_hstshijack_var_link){
      if (obf_hstshijack_var_link.href && obf_hstshijack_var_link.href !== "") {
        var obf_hstshijack_var_container = document.createElement("obf_hstshijack_dummy");
        obf_hstshijack_var_container.append(obf_hstshijack_var_link.cloneNode(true))
        obf_hstshijack_var_container.addEventListener("click", function(e){
          e.preventDefault();
          location.href = obf_hstshijack_var_link.href;
        });
        obf_hstshijack_var_link.before(obf_hstshijack_var_container);
        obf_hstshijack_var_link.remove();
      }
    });
  }

  var obf_hstshijack_var_stylesheet = document.createElement("style");
  obf_hstshijack_var_stylesheet.innerText = `.gb_Pa{box-shadow:none}`;
  document.body.append(obf_hstshijack_var_stylesheet);
});

