function addRows(){
		var rowstocreate = document.getElementById("rowswanted").value;
		var rowspantobe = document.getElementById("rowspantobe").value;
		
		
		if (rowstocreate > 0) {
			html = `<td class="highcell" rowspan="` + rowspantobe + `"><floattext>newly added values</floattext></td>
				<td>its amazing</td>
				<td>wow</td>`
			addElement("tablebody", "tr", "row4", html);
			rowstocreate = rowstocreate - 1;
			rowspantobe = rowspantobe - 1;
		}
		html = `<td>its amazing</td>
				<td>wow</td>`
		while (rowstocreate > 0 && rowspantobe > 0) {
			rowstocreate = rowstocreate - 1;
			rowspantobe = rowspantobe - 1;
			addElement("tablebody", "tr", "rowmore", html)
		}
		html = `<td>more newly added values</td>
		<td>its amazing</td>
				<td>wow</td>`
		while (rowstocreate > 0){
			rowstocreate = rowstocreate - 1;
			addElement("tablebody", "tr", "rowmore", html)
		}
		
	}
	
	function addElement(parentId, elementTag, elementId, html) {
		// Adds an element to the document
		var p = document.getElementById(parentId);
		var newElement = document.createElement(elementTag);
		newElement.setAttribute('id', elementId);
		newElement.innerHTML = html;
		p.appendChild(newElement);
	}