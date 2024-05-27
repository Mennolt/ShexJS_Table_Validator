//this is a worker thread file for displaying tables for the Tabular Online Validator
//it handles the timeconsuming aspect of displaying a new part of the table: 
//fetching required queries from wikidata and using them

//input: 
//wikibase query endpoint
//wikibase prefix
//the input data for this items validation

//output:
//a markedup array, ready for the displayTable function

onmessage = function(endpoint, wikibase_pre, data)) => {
	prefixes = `
PREFIX wd: <` + wikibase_pre + `/entity/>
PREFIX p: <` + wikibase_pre + `/prop/>
PREFIX ps: <` + wikibase_pre + `/prop/statement/>
PREFIX wdt: <` + wikibase_pre + `/prop/direct/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX pq: <` + wikibase_pre + `/prop/qualifier/>
PREFIX pr:  <` + wikibase_pre + `/prop/reference/>
#specific prefixes
PREFIX wdv: <` + wikibase_pre + `/entity/value/>
PREFIX s: <` + wikibase_pre + `/entity/statement/>
PREFIX psv: <` + wikibase_pre + `/prop/statement/value/>
`

	
	for (var i = 0; i < data.length; i++){
		var arry = createArray(data[i])
		
		
		// get data required for pretty display
		
		var item_ID_link = data[i].node.split('/')
		var query = prefixes + `

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
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } # Helps get the label in your language, if not, then en language
  #only get English language item names
  FILTER(LANGMATCHES(LANG(?item), "en"))
}` 
		
		await fetch(endpoint + "?" + new URLSearchParams({'format' : "json"}), {
				method : "POST",
				body: new URLSearchParams({'query' : query}),
				headers: {
					'Accept': 'application/sparql-results+json',
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
					},
					mode:'cors'
			}).then(response => response.json()).then(querydata => {
				var markedUpArry = addMarkupData(arry, querydata, data[i].node)
				
				postMessage(markedUpArry)
				
			})
}





//the associated code posting and receiving messages (I'm not sure how to run this yet)

//init worker: 
const myWorker = new Worker("table-mode-worker.js");

//to call:
myWorker.postMessage(endpoint, wikibase_pre, data)

//to display output when getting results
myWorker.onmessage = (result) => {
	displayTable(result)
}