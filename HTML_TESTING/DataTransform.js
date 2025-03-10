async function renderOutput(data) {
	if (!data){
		var data = JSON.parse(loadFile('./Responses/Eval_E2_v3.txt'))
	}
	
	
	//create headers for output table
	headers = ["Item", "Shape", "Property", "Value", "Error Type", "Triple Link", "Further Error Info"]
	for (var i = 0 ; i < headers.length; i++) {
		addElement('header_row', 'th', "", headers[i])
	}

	
	for (var i = 0; i < data.length; i++){
		var arry = createArray(data[i])
		
		
		// get data required for pretty display
		var endpoint = "https://validatortest.wikibase.cloud/query/sparql"
		var item_ID_link = data[i].node.split('/')
		var query = `
PREFIX wd: <https://validatortest.wikibase.cloud/entity/>
PREFIX p: <https://validatortest.wikibase.cloud/prop/>
PREFIX ps: <https://validatortest.wikibase.cloud/prop/statement/>
PREFIX wdt: <https://validatortest.wikibase.cloud/prop/direct/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX pq: <https://validatortest.wikibase.cloud/prop/qualifier/>
PREFIX pr:  <https://validatortest.wikibase.cloud/prop/reference/>
#specific prefixes
PREFIX wdv: <https://validatortest.wikibase.cloud/entity/value/>
PREFIX s: <https://validatortest.wikibase.cloud/entity/statement/>
PREFIX psv: <https://validatortest.wikibase.cloud/prop/statement/value/>


SELECT ?item ?p_property ?p_propertyLabel ?statementLink ?simplevalue ?simplevalueLabel 
WHERE
{
  wd:` + item_ID_link[item_ID_link.length - 1] + ` ?property ?statementLink . 
  ?statementLink ?simplevalueLink ?simplevalue .
  wd:` + item_ID_link[item_ID_link.length - 1] + ` ?propdirect ?simplevalue.
  wd:` + item_ID_link[item_ID_link.length - 1] + ` rdfs:label ?item.
 
  #find property label (thanks to tagishsimon)
  ?p_property wikibase:claim ?property .
  
  FILTER(STRSTARTS(STR(?propdirect), STR(wdt:)))
  FILTER(STRSTARTS(STR(?property), STR(p:))) 
  #BIND(STR(?simplevalueLink) as ?xxx)
  FILTER(STRSTARTS(STR(?simplevalueLink),  STR(ps:)))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } # Helps get the label in your language, if not, then en language
}` //` + item_ID_link[item_ID_link.length - 1] + `
 
		await fetch(endpoint + "?" + new URLSearchParams({'format' : "json"}), {
				method : "POST",
				body: new URLSearchParams({'query' : query}),
				headers: {
					'Accept': 'application/sparql-results+json',
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
					},
					mode:'cors'
			}).then(response => response.json()).then(querydata => {
				console.log(querydata)
				var markedUpArry = addMarkupData(arry, querydata)
				
				displayTable(markedUpArry)
				
			})

		//TODO: Use SPARQL Query to convert links into nicer values with embedded links
		//displayTable(arry)
		addElement('output_container', 'div', 'test', '[Item, Property, value, shape, issue type]') ;
		addElement('output_container', 'div', 'test', JSON.stringify(arry)) ;
		addElement('output_container', 'div', 'test', '<br>')
		addElement('output_container', 'div', 'test', JSON.stringify(data[i]))
		addElement('output_container', 'div', 'test', '<br>')
		addElement('output_container', 'div', 'test', '<br>')
	}
}

function createArray(x) {
	//intent: take a Eval results (ret) as JSON
	//turn it into an array with columns item, shape, property, value,  issue type, triple link, full error message
	//const x = JSON.parse(loadFile('./Responses/Eval_E3_v2.txt'))
	

	
	if (x.status === 'conformant') {
		//if here: add 1 row containing item name, then conformant in all other cells
		const row_vals = [{item : {text : x.node, rowcount : 1}, shape : x.shape.term, 
		property : null, value : null,
		error_type : 'conforms'}]
		
		return row_vals
	}
	
	//addElement('output_container', 'div', 'test', JSON.stringify(x[0].appinfo.errors[0].errors.errors[0]))
	
	var tableRows = goThroughJSON(x.appinfo);
	
	//sort rows, starting on the last column and going backwards towards the first
	tableRows.sort(create_compare_by_attr('error_type'))
	/* for (var i = 0 ; i < tableRows.length;i++){
		console.log(tableRows[i].error_type)
	} */
	tableRows.sort(create_compare_by_attr('value'))
	/* for (var i = 0 ; i < tableRows.length;i++){
		console.log(tableRows[i].value)
	} */
	tableRows.sort(create_compare_by_attr('property'))
	/* for (var i = 0 ; i < tableRows.length;i++){
		console.log(tableRows[i].property)
	} */
	tableRows.sort(create_compare_by_attr('shape'))
	/* for (var i = 0 ; i < tableRows.length;i++){
		console.log(tableRows[i].shape)
	} */
	
	//calculate the required rowcounts for each 
	var prop_counts = [0]
	var value_counts = [0]
	var shape_counts = [0]
	last_value = tableRows[0].value
	last_prop = tableRows[0].property
	last_shape = tableRows[0].shape
	for (var i = 0 ; i < tableRows.length ; i++){
		//Property
		if (tableRows[i].property == last_prop) {
			prop_counts[prop_counts.length-1] += 1
		} else {
			prop_counts.push(1)
			last_prop = tableRows[i].property
		}
		//value
		if (tableRows[i].value == last_value) {
			value_counts[value_counts.length-1] += 1
		} else {
			value_counts.push(1)
			last_value = tableRows[i].value
		}
		//shape
		if (tableRows[i].shape == last_shape) {
			shape_counts[shape_counts.length-1] += 1
		} else {
			shape_counts.push(1)
			last_shape = tableRows[i].shape
		}
	}
	//for item, shape, property, and value, specify the required rowcount. For items not to be shown, use 0
	var value_countdown = 0
	var prop_countdown = 0
	var shape_countdown = 0
	for (var i = 0 ; i < tableRows.length; i++){
		//add the item to the front of the row, with rowcount
		var rowcount = tableRows.length * (i == 0);
		tableRows[i].item = {text : x.node, rowcount : rowcount};
		
		//add the right rowcount for value
		if (value_countdown == 0) {
			tableRows[i].value = {text : tableRows[i].value, rowcount : value_counts[0]};
			value_countdown = value_counts.shift()-1
		} else {
			tableRows[i].value = {text : tableRows[i].value, rowcount : 0}
			value_countdown -= 1
		}
		//property
		if (prop_countdown == 0) {
			tableRows[i].property = {text : tableRows[i].property, rowcount : prop_counts[0]}
			prop_countdown = prop_counts.shift()-1
		} else {
			tableRows[i].property = {text : tableRows[i].property, rowcount : 0}
			prop_countdown -= 1
		}
		//shape
		if (shape_countdown == 0) {
			tableRows[i].shape = {text : tableRows[i].shape, rowcount : shape_counts[0]}
			shape_countdown = shape_counts.shift()-1
		} else {
			tableRows[i].shape = {text : tableRows[i].shape, rowcount : 0}
			shape_countdown -= 1
		}
	}
	
	

	return tableRows
	
	
	 
}

function goThroughJSON(data) {
	//takes JSON validation report
	//returns Array of JSON Objects which represents a table
	
	var output = []
	const objectConstructor = ({}).constructor
	
	if (data.errors instanceof Array) {
		//catching NodeConstraintViolations with a single string as their list of errors
		if (typeof(data.errors[0]) === 'string') {
			output = [createArrayRow(data)]
		} else {
		
			for (var i = 0 ; i < data.errors.length; i++) {
				//recurse if there are more errors in the JSON object inside this one
				addition = goThroughJSON(data.errors[i])
				//this makes it so in the end regardless of the amount of recursion done the system has an array representing the table, 
				//where each element is a dictionary representing a row
				
				//console.log(addition)
				if (addition.constructor === objectConstructor) { //comparisaon based on https://stackoverflow.com/questions/11182924/how-to-check-if-javascript-object-is-json
					//if the addition is already an Array of JSON objects, add it directly
					output = output.concat(addition)
				} else {
					//otherwise, wrap it first
					output = output.concat(addition)
				}
				
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
	//creates a JSON object representing a row in the output data
	//output row template: {property, value, error type}
	
	var output = {}
	if (item.type == "MissingProperty") {
		output.property =  item.property;
		output.value = null; 
		output.error_type = item.type
	} else if (item.type == "NodeConstraintViolation"){
		output.error_type = item.type
		output.value = item.node.value
		output.property = null
		output.error_fulltext = item.errors[0]
	} else if (item.type == "ExcessTripleViolation") {
		output.error_type = item.type
		output.error_fulltext = item
		output.property = item.triple.predicate.value
		output.value = item.triple.object.value
	} else if (item.type == "TypeMismatch") {
		console.log(item)
		console.log('type mismatch detected! Implement to continue')
	} else if (item.type == 'SemActFailure') {
		console.log(item)
		console.log('Semaphote Act Failure detected! Implement to continue')
	} else if (item.type == 'ClosedShapeViolation') {
		console.log(item)
		console.log('Closed Shape Violation detected! Implement to continue')
	}else {
		output.error_type = item.type
		output.error_fulltext = item
		output.property = null
		output.value = null
	}
	return output
}

function create_compare_by_attr(attr){
	//Returns a function that takes two JSON objects, and compares their 'attr' attribute
	//This returned function can be used to sort an Array of JSON Objects on said attribute stably using ArrayName.sort(TheNewFunction)
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

function displayTable(dataArray){
	//Takes an array of JSON objects, where each object represents a row. 
	//Displays this as a table with columns item, shape, property, value,  issue type, triple link, full error message
	//All row HTML elements have an id of [item_ID]_[row_nr]
	var item_link_split = dataArray[0].item.text.split("/")
	var item_ID = item_link_split[item_link_split.length - 1]
	var row_nr = 0
	
	for (var i = 0 ; i < dataArray.length; i++) {
		full_ID = item_ID + "_" + row_nr
		addRow(dataArray[i], full_ID)
		row_nr+=1
	}
}

function addRow(rowJSON, row_ID) {
	//console.log(rowJSON)
	//adds a single row to the table
	//add row element to child cells to:
	addElement('table_body', 'tr', row_ID, "")
	//add all child cells in order
	addCell(rowJSON.item, row_ID)
	addCell(rowJSON.shape, row_ID)
	addCell(rowJSON.property, row_ID)
	addCell(rowJSON.value, row_ID)
	addCell(rowJSON.error_type, row_ID)
	addCell(rowJSON.triple_link, row_ID)
	addCell(JSON.stringify(rowJSON.error_fulltext), row_ID)
}

function addCell(cellJSON, row_ID, height){
	//add a single cell to the specified row of a table
	if (cellJSON instanceof Object){ //what to do for complex input
		//don't create elements for things not to be displayed
		if (cellJSON.rowcount != 0) {
			var p = document.getElementById(row_ID);
			var newElement = document.createElement('td');
			newElement.setAttribute('class', "highcell");
			newElement.setAttribute('rowspan', cellJSON.rowcount);
			if (cellJSON.link) {
				newElement.innerHTML = "<floattext><a href=" + cellJSON.link + ">" + cellJSON.text + "</a></floattext>";
			} else {
				newElement.innerHTML = "<floattext>" + cellJSON.text + "</floattext>";
			}
			p.appendChild(newElement);
			//todo: adjust so as to add a link via cellJSON.link, possibly split up text
		}
	} else { //what to do for simple cells
		var p = document.getElementById(row_ID);
		var newElement = document.createElement('td');
		newElement.innerHTML = "<floattext>" + cellJSON + "</floattext>";
		p.appendChild(newElement)
	}
}

function addMarkupData(dataArray, markupArray) {
	//goes through dataArray. For each item property and value tries to add markup information using the markupArray
	//also cuts shape text prefix
	
	for (var i=0; i<dataArray.length;i++){
		//shape
		if (dataArray[i].shape instanceof Object && dataArray[i].shape.text) {
			//is not just the string start, but a string with rowcount applied
			//then get only the identifying part
			//add link as link (note: this means if user clicks it it tries to download schema text instead of going to schema page)
			dataArray[i].shape.link = dataArray[i].shape.text
			var splitarry = dataArray[i].shape.text.split('/')
			dataArray[i].shape.text = splitarry[splitarry.length-1]
		}
		//Item
		//TODO: check MarkupArray for correct text
		if (dataArray[i].item instanceof Object && dataArray[i].item.text){
			dataArray[i].item.link = dataArray[i].item.text
			//var splitarry = dataArray[i].item.text.split('/')
			dataArray[i].item.text = markupArray.results.bindings[0].item.value//splitarry[splitarry.length-1]
		}
		//Property
		//TODO: check MarkupArray for correct text
		var working_pj_list = []
		if (dataArray[i].property instanceof Object && dataArray[i].property.text){ 
			dataArray[i].property.link = dataArray[i].property.text
			var splitarry = dataArray[i].property.text.split('/')
			dataArray[i].property.text = splitarry[splitarry.length-1] //if no match found, fail semi-gracefully by showing the ID instead of the entire link

			pID = dataArray[i].property.link.split('/')[dataArray[i].property.link.split('/').length-1]
			for (var j=0; j<markupArray.results.bindings.length; j++){
				//check whether link (.property.link) matches markuparray.results.bindings[j].p_property.value
				query_pID = markupArray.results.bindings[j].p_property.value.split('/')[markupArray.results.bindings[j].p_property.value.split('/').length-1]
				if (pID == query_pID){
					dataArray[i].property.text = markupArray.results.bindings[j].p_propertyLabel.value
					working_pj_list.push(j)
				}
			}
		}
		//TODO: check MarkupArray for correct text
		//Value
		var working_vj_list = []
		if (dataArray[i].value instanceof Object && dataArray[i].value.text){
			dataArray[i].value.link = dataArray[i].value.text
			var splitarry = dataArray[i].value.text.split('/')
			dataArray[i].value.text = splitarry[splitarry.length-1] //if no match found, fail semi-gracefully by showing the ID instead of the entire link
			
			for (var j=0; j<markupArray.results.bindings.length;j++){
				query_pID = markupArray.results.bindings[j].simplevalue.value.split('/')[markupArray.results.bindings[j].simplevalue.value.split('/').length-1]
				if (dataArray[i].value.text == query_pID){
					dataArray[i].value.text = markupArray.results.bindings[j].simplevalueLabel.value
					working_vj_list.push(j)
				}
			}
		}
		
		//if something was found for both property and value, find the associated statement Link
		dataArray[i].triple_link = null //fail gracefully if no triple link involved
		for (j=0; j<working_pj_list.length;j++){
			for (k=0; k<working_vj_list.length;k++){
				if (j==k){
					console.log('found')
					dataArray[i].triple_link = {text : "Link", rowcount : 1, link : markupArray.results.bindings[j].statementLink.value}
				}
			}
		}
	}
	return dataArray
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