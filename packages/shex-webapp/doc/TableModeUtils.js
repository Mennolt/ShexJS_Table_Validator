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
		document.getElementById("export-table").style.display = "block";
	} else {
		document.getElementById("table-mode-results").style.display = "none";
		document.getElementById("export-table").style.display = "none";
	}
}

async function exportTable(event){
	var table_id = "table-mode-results"
	console.log(table_id)
	//step 0: get a clone of the Node
	var mynode = document.getElementById(table_id).cloneNode(true)
	
	//step 1: rewrite the data to fit the required values (eg. remove floattext tags, remove table head and body tags)
	//TBD
	//"class="wikitable sortable static-row-numbers sticky-header col1left"
	mynode.setAttribute("class", "wikitable sortable static-row-numbers sticky-header col1left")
	mynode = prepHTMLforExport(mynode)
	
	//step 2: do the actual copying
	//for chrome:
	try {
		const type = "text/plain";
		const blob = new Blob([mynode.outerHTML], { type });
		const data = [new ClipboardItem({ [type]: blob })];
		await navigator.clipboard.write(data);
	} catch (error) {
		// thanks to https://stackoverflow.com/questions/33855641/copy-output-of-a-javascript-variable-to-the-clipboard
		console.log("using secondary copy mechanism in exportTable due to error")
		console.log("error")
		var dummy = document.createElement("input");
		document.body.appendChild(dummy);
		dummy.setAttribute("id", "dummy_id");
		document.getElementById("dummy_id").value = mynode.outerHTML
		//dummy.value = mynode
		dummy.select();
		document.execCommand("copy");
		document.body.removeChild(dummy);
	}
}

function prepHTMLforExport(element, top_level = true, in_th = false){
	//recursively goes into an HTML element, preparing it for export by:
	//removing thead and tbody statements but leaving their contents in the parent element
	//removing floattext tags, to be replaced with a ... in child/parent element
	//replacing hyperlink a tags with [<link> <text>]
	
	//two flags are used, one to indicate that final code needs to be processed, and one to indicate you are in the table head, used to add the extra column
	
	//checking flags
	if (element.tagName == "THEAD"){
		in_th = true
	}
	
	
	//go through child elements and prep each for export
	var newchildren = []
	var children = element.childNodes
	for (var i=0;i<children.length;i++){
		var newkid = prepHTMLforExport(children[i], false, in_th)
		
		//if the new kid is actually a list, concat the lists
		if (newkid instanceof Array){
			newchildren = newchildren.concat(newkid)
		} else {
			newchildren.push(newkid)
		}
	}
	//if to be removed, return a list of children
	if (["FLOATTEXT", "TBODY", "THEAD"].includes(element.tagName)){
		return newchildren
	} else if (element.tagName=="A"){
		//replace hyperlink tags
		//with a node with 3 kids: two text nodes with the required bits to make a wikidata link, and with current children
		//TODO: use proper internal links rather than external ones, where possible (requires seeing what kind of link it is
		return [document.createTextNode("["+element.href+" "), ...newchildren, document.createTextNode("]")]
	} else if (element.tagName=="TR") {
		//this feature is waiting for further wikidata feedback
		if (in_th) {
			//construct a new cell with the right Text
			
			//add and return that
			newchildren.push(extra_col)
		} else {
			//construct a new cell with text "not checked" or somethign similar
		}
		if (newchildren.length > 0) {
			element.replaceChildren(...newchildren)
		}
		return element
	} else {
		//else add children to self and return self
		if (newchildren.length > 0) {
			element.replaceChildren(...newchildren)
		}
		return element
	}
}