function createArray() {
	//intent: take a Eval results (ret) as JSON
	//turn it into an array with columns item, shape, property, value,  issue type, triple link, full error message
	const x = JSON.parse(loadFile('./Responses/Eval_E2_v1.txt'))
	

	
	if (x.status === 'conformant') {
		//if here: add 1 row containing item name, then conformant in all other cells
		return
	}
	
	addElement('output_container', 'div', 'test', JSON.stringify(x[0].appinfo.errors[0].errors.errors[0]))
	
	var tableRows = goThroughJSON(x[0].appinfo);
	
	for (var i = 0; i < tableRows.length; i++){
		//add the item to the front of the row
		tableRows[i].unshift(x[0].node)
	}
	
	
	addElement('output_container', 'div', 'test', '[Item, Property, value, issue type]') ;
	addElement('output_container', 'div', 'test', JSON.stringify(tableRows)) ;
	addElement('output_container', 'div', 'test', '<br>')
	addElement('output_container', 'div', 'test', JSON.stringify(x))
}

function goThroughJSON(data) {
	//takes JSON validation report
	//returns Array of Arrays which represents a table
	
	var output = []
	
	if (data.errors instanceof Array) {
		for (var i = 0 ; i < data.errors.length; i++) {
			//recurse if there are more errors in the JSON object inside this one
			addition = goThroughJSON(data.errors[i])
			//this makes it so in the end regardless of the amount of recursion done the system has an array representing the table, 
			//where each element is an array representing a row
			if (addition[0] instanceof Array) {
				output = output.concat(addition)
			} else {
				output = output.concat([addition])
			}
			
		}
	} else if (data.errors instanceof Object){
		//recurse if errors is a single JSON dict
		output = goThroughJSON(data.errors)
	} else {
		//if you reached the bottom of the error stack, create a row for this error
		output = createArrayRow(data)
	}
	
	return output
}

function createArrayRow(item) {
	//takes an item of one of the types that requires outputting 1 row
	//creates an array item representing a row in the output data
	//output row template: [property, value, error type]
	console.log(item)
	if (item.type == "MissingProperty") {
		return [item.property, null, item.type]
	} else {
		console.log(item)
		return [item.type, item]
	}
	
}


//imported functions:
function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}

function addElement(parentId, elementTag, elementId, html) {
		// Adds an element to the document
		var p = document.getElementById(parentId);
		var newElement = document.createElement(elementTag);
		newElement.setAttribute('id', elementId);
		newElement.innerHTML = html;
		p.appendChild(newElement);
	}