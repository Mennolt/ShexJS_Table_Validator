function createArray() {
	//intent: take a Eval results (ret) as JSON
	//turn it into an array with columns item, shape, property, value,  issue type, triple link, full error message
	const x = JSON.parse(loadFile('./Responses/Eval_E3_v2.txt'))
	

	
	if (x.status === 'conformant') {
		//if here: add 1 row containing item name, then conformant in all other cells
		return
	}
	
	//addElement('output_container', 'div', 'test', JSON.stringify(x[0].appinfo.errors[0].errors.errors[0]))
	
	var tableRows = goThroughJSON(x[0].appinfo);
	
	for (var i = 0; i < tableRows.length; i++){
		//add the item to the front of the row
		tableRows[i].item = x[0].node
	}
	
	//sort rows, starting on the last column and going backwards towards the first
	tableRows.sort(create_compare_by_attr('error_type'))
	tableRows.sort(create_compare_by_attr('value'))
	tableRows.sort(create_compare_by_attr('property'))
	
	
	addElement('output_container', 'div', 'test', '[Item, Property, value, shape, issue type]') ;
	addElement('output_container', 'div', 'test', JSON.stringify(tableRows)) ;
	addElement('output_container', 'div', 'test', '<br>')
	addElement('output_container', 'div', 'test', JSON.stringify(x))
}

function goThroughJSON(data) {
	//takes JSON validation report
	//returns Array of Arrays which represents a table
	
	var output = []
	const objectConstructor = ({}).constructor
	
	if (data.errors instanceof Array) {
		for (var i = 0 ; i < data.errors.length; i++) {
			//recurse if there are more errors in the JSON object inside this one
			addition = goThroughJSON(data.errors[i])
			//this makes it so in the end regardless of the amount of recursion done the system has an array representing the table, 
			//where each element is a dictionary representing a row
			
			console.log(addition)
			if (addition.constructor === objectConstructor) { //comparisaon based on https://stackoverflow.com/questions/11182924/how-to-check-if-javascript-object-is-json
				//if the addition is already an Array of JSON objects, add it directly
				output = output.concat(addition)
			} else {
				//otherwise, wrap it first
				output = output.concat(addition)
			}
			
		}
	} else if (data.errors instanceof Object){
		//recurse if errors is a single JSON dict
		output = goThroughJSON(data.errors)
	} else {
		//if you reached the bottom of the error stack, create a row for this error
		output = createArrayRow(data)
	}
	//make sure the output is an array containing row JSON objects
	if (output.constructor === objectConstructor) {
		output = [output]
	}
	
	//try to add a shape to each datapoint that doesn't have one yet:
	for (var i = 0 ; i < output.length; i++){
		if (!(Object.hasOwn(output[i], 'shape')) && Object.hasOwn(data, 'shape')){
			output[i].shape = data.shape
		}
	}
	
	
	return output
}

function createArrayRow(item) {
	//takes an item of one of the types that requires outputting 1 row
	//creates an array item representing a row in the output data
	//output row template: {property, value, error type}
	
	var output = {}
	console.log(item)
	if (item.type == "MissingProperty") {
		output.property =  item.property;
		output.value = null; 
		output.error_type = item.type
	} else {
		output.error_type = item.type
		output.error_fulltext = item
	}
	return output
}

function create_compare_by_attr(attr){
	return function(a,b) {
		if (a[attr] > b[attr]){
			return 1
		} else if (a[attr] < b[attr]) {
			return -1
		} else {
			return 0
		}
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