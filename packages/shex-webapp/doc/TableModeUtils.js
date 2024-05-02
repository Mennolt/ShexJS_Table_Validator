function tableSelectCheck(selector) {
	//reveals certain input fields only needed in table mode, when in table mode
	if (selector){
		if (selector.value == "table"){
			document.getElementById("table-parameters").style.display = "block";
		} else {
			document.getElementById("table-parameters").style.display = "none";
		}
	} else {
		document.getElementById("table-parameters").style.display = "block";
	}
}

function revealTable() {
	//if currently in table mode, shows the table results div
	if($("#interface").val()=="table") {
		document.getElementById("table-mode-results").style.display = "block";
	} else {
		document.getElementById("table-mode-results").style.display = "none";
	}
}