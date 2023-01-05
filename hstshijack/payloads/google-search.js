globalThis.addEventListener("DOMContentLoaded", function(){
  "use strict";

  if (location.pathname === "/search") {
    document.querySelectorAll("a").forEach(function(obf_var_link){
      if (obf_var_link.href && obf_var_link.href !== "") {
        var obf_var_container = document.createElement("obf_dummy");
        obf_var_container.append(obf_var_link.cloneNode(true))
        obf_var_container.addEventListener("click", function(e){
          e.preventDefault();
          location.href = obf_var_link.href;
        });
        obf_var_link.before(obf_var_container);
        obf_var_link.remove();
      }
    });
  }

  var obf_var_stylesheet = document.createElement("style");
  obf_var_stylesheet.innerText = `.gb_Pa{box-shadow:none}`;
  document.body.append(obf_var_stylesheet);
});

