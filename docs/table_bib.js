var map_props = ["class", "style", "color", "background-color"];
var exp_formats = ["clipboard", "download"];
var row_db_click = null;
var tags_index = {};
var tags_set = {};
var tags_str = {};
var tags_keep_case = ["alg"];
var tags_choice_exclude = ["rkey"];
var tag_key = "rkey";
var tag_mrk = "#";
var tag_key_own = tag_mrk+tag_key;
var tag_join = ";";
var conjunction_tk = "*AND*";
var pack_class = "cell-pack";
var unpack_class = "cell-unpack";
var pack_top_mrk = "top";

function isObject(value) {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

function replaceRecurse(object, mmap) {
    if ( Array.isArray(object) ) {
        for (let i = 0; i < object.length; i += 1) {
            replaceRecurse(object[i], mmap);
        }       
    }
    else if ( isObject(object) ) {
        const entries = Object.entries(object);

        for (let i = 0; i < entries.length; i += 1) {
            const [objectKey, objectValue] = entries[i];

            if ( typeof objectValue === 'string' ) {
                if ( mmap.hasOwnProperty(objectValue) ) {
                    object[objectKey] = mmap[objectValue];
                }
            }
            else {
                replaceRecurse(objectValue, mmap);
            }
        }
    }
}


function sanitizeHTML(value){
	if(value){
		var entityMap = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;',
			'/': '&#x2F;',
			'`': '&#x60;',
			'=': '&#x3D;'
		};
        
		return String(value).replace(/[&<>"'`=\/]/g, function (s) {
			return entityMap[s];
		});
	}else{
		return value;
	}
}

function emptyToSpace(value){
	return value === null || typeof value === "undefined" || value === "" ? "&nbsp;" : value;
}

function doExport(table, c_init, subcVal, exp_to, export_subcs, top_title=null){
    if (exp_to == "clipboard"){
        exp_format = "clipboard";
    } else {
        exp_format = "download";
    }
    if ( c_init.hasOwnProperty(exp_format) ) {
        // prepare column selection
        if ( subcVal === "all" ){
            resetColsExport(table, c_init["all"], exp_format);
        } else if (subcVal != -1 ){
            setColsExport(table, export_subcs[subcVal], exp_format);
        }
        
        // actual export
        switch(exp_to) {
        case "csv":
            table.download("csv", "data.csv");
            break;
        case "pdf":
            table.download("pdf", "data.pdf", { orientation:"landscape",
                                                title: top_title || "",
                                                autoTable: {
                                                    margin: { top: 40, left: 20, right: 20, bottom: 20 },
                                                    headStyles: { fontSize: 9,
                                                                  fontStyle: "bold",
                                                                  textColor: 000,
                                                                  fillColor: 220,
                                                                },
                                                    styles: { fontSize: 9,
                                                              textColor: 111
                                                    }
		                                            // fontSize: 8,
		                                            // cellPadding: 6,
		                                            // 
	                                            },
                                                "jsPDF": {format: "a3"}
                                              });
            break;
        default:
            table.copyToClipboard();
        }
            
        // reset column selection
        if (subcVal != -1 ){
            resetColsExport(table, c_init[exp_format], exp_format);
        }
    }
}

function setColsExport(table, exp_subc, exp_format){
    let cols = table.columnManager.columnsByIndex;
    for (let i = 0; i < cols.length; i++) {    
        if ( ( exp_subc["fields"].includes(cols[i]["field"]) && ! exp_subc["exclude"]) || ( ! exp_subc["fields"].includes(cols[i]["field"]) && exp_subc["exclude"]) ){
            cols[i].definition[exp_format] = true;
		}
        else {
            cols[i].definition[exp_format] = false;
        }
	}
}

function resetColsExport(table, exp_def, exp_format){
    let cols = table.columnManager.columnsByIndex;
    for (let i = 0; i < cols.length; i++) {
        if ( exp_def[i] === null ){
            delete cols[i].definition[exp_format];
        } else if ( exp_def[i] ){
            cols[i].definition[exp_format] = true;
        } else {
            cols[i].definition[exp_format] = false;
        }
        // switch(exp_def[i]) {
        // case 1:
        //     cols[i].definition[exp_format] = true;
        //     break;
        // case 0:
        //     cols[i].definition[exp_format] = false;
        //     break;
        // default:
        //     delete cols[i].definition[exp_format];
        // } 
	}
}

function setColsViz(table, exp_subc){
    let cols = table.columnManager.columnsByIndex;
    for (let i = 0; i < cols.length; i++) {    
        if ( ( exp_subc["fields"].includes(cols[i]["field"]) && ! exp_subc["exclude"]) || ( ! exp_subc["fields"].includes(cols[i]["field"]) && exp_subc["exclude"]) ){
            cols[i].show();
		}
        else {
            cols[i].hide();
        }
	}
}

function resetColsViz(table, exp_def){
    let cols = table.columnManager.columnsByIndex;
    for (let i = 0; i < cols.length; i++) {
        if ( exp_def[i] ) {
            cols[i].show();
        } else {
            cols[i].hide();
        } 
	}
}

function tagFilter(data, filterParams){
    if ( filterParams["tags"].length > 0 ){
        for (let i = 0; i < filterParams["tags"].length; i += 1) {
            if ( mkTagString(tag_key, data.ref_key) == filterParams["tags"][i] ){
                return true;
            }
            else if ( mkTagString(tag_key_own, data.ref_key) == filterParams["tags"][i] ){
                return true;
            }
            else if ( tags_set.hasOwnProperty(data.ref_key) && tags_set[data.ref_key].has(filterParams["tags"][i]) ){
                return true;
            }
        }
        if ( tags_str.hasOwnProperty(data.ref_key) ){
            return checkString(tags_str[data.ref_key], filterParams["patt_tags"]);
        }
        return false;
        // let regex = new RegExp(filterParams["patt_tags"]);
        // return tags_str[data.ref_key].search(regex) != -1;
    }       
    return true;
}

function addSearchTag(tag_val){
    var tagInput = document.querySelector('#input-tag');
    if (tagInput.value.length > 0){            
        tagInput.value = tagInput.value+tag_join+tag_val;
    }
    else {
        tagInput.value = tag_val;
    }
    tagInput.click();
}

function clickSearchTag(tag_name, tag_content){
    addSearchTag(mkTagString(tag_name, tag_content));
}

function clearSearchTag(){
    document.querySelector('#input-tag').value = "";
    document.querySelector('#input-tag').click();
}


function toPieces(val, sep=",", first_only=false, with_full=false){
    let pieces = [];
    if (with_full) {
        pieces.push(val);
    }
    if (typeof sep === 'string') {
        let parts = val.replace(/\([^()]*\)/g,'').split(sep);
        let upto = parts.length;
        if (first_only && upto > 1){
            upto = 1;
        }
        for (let i = 0; i < upto ; i += 1) {
            let piece = parts[i].replace(/^[\s,]+|[\s,]+$/gm,'');
            if (piece != ""){            
                pieces.push(piece);
            }
        }
    }
    return pieces;
}

function getUniqueDataColumnPieces(data, column, act_pos=[], active_only=false, sort_values=null, sep=",", first_only=false, with_full=false){
	var counts = {};
    var pieces = [];

    for (let i = 0; i < data.length; i += 1) {
		var val = column.getFieldValue(data[i]);
		if(val !== null && typeof val !== "undefined" && val !== ""){
            if (!active_only || act_pos[i] >= 0){
                toPieces(val, sep, first_only, with_full).forEach(function(sval){
                    if ( ! counts.hasOwnProperty(sval)){
                        counts[sval] = 0;
                    }
                    if (act_pos[i] >= 0){
                        counts[sval]+= 1; // = true;
                    }
                });
            }
        }
    }
    
    if(sort_values){
		if(sort_values == "nzfirst"){
            pieces = Object.keys(counts).sort(function(a, b){
                if (counts[a] === 0 && counts[b] > 0){
                    return 1;
                }
                else if (counts[a] > 0 &&  counts[b] === 0){
                    return -1;

                }
                else {
                    return a.localeCompare(b)
                }
            });            
        }
		else if(sort_values == "casc" || sort_values == "cdesc" ){
            pieces = Object.keys(counts).sort(function(a, b){ if (counts[a] === counts[b]) { return a.localeCompare(b) } else {return counts[a]-counts[b]}});
            if(sort_values == "cdesc"){
                pieces.reverse();
            }
        }
		else if(sort_values == "asc"){
			pieces = Object.keys(counts).sort();
		}else{
			pieces = Object.keys(counts).sort().reverse();
		}
	}else{
		pieces = Object.keys(counts);
	}
	return [pieces, counts];
}



// FORMATTERS, FILTERS, ETC.
// ---------------------------------------

var fmt_map = {}
// function clipboardCopyFormatter(type, output){
//     return output;
// }
// fmt_map["fmt_clipboardCopyFormatter"] = clipboardCopyFormatter;

function selectedSort(a, b, aRow, bRow, column, dir, sorterParams){
    //a, b - the two values being compared
    //aRow, bRow - the row components for the values being compared (useful if you need to access additional fields in the row data for the sort)
    //column - the column component for the column being sorted
    //dir - the direction of the sort ("asc" or "desc")
    //sorterParams - sorterParams object from column definition array
    
    return aRow.isSelected() - bRow.isSelected(); //you must return the difference between the two values
}
fmt_map["fmt_selectedSort"] = selectedSort;

function exportRowRange(){
    if (row_db_click !== null){
        return [row_db_click];
    }
    else if (this.getSelectedRows().length > 0){
        return this.getRows("active").filter((row) => {
            return row.isSelected();
        });
    }
    else {       
        return this.getRows("active");
    }
}
fmt_map["fmt_exportRowRange"] = exportRowRange;

/// DROP-SELECT
//dropdown select editor
function custSelectFilterEditor(cell, onRendered, success, cancel, editorParams){
	var self = this,
	cellEl = cell.getElement(),
	initialValue = cell.getValue(),
	vertNav = editorParams.verticalNavigation || "editor",
	initialDisplayValue = typeof initialValue !== "undefined" || initialValue === null ? (Array.isArray(initialValue) ? initialValue : [initialValue]) : (typeof editorParams.defaultValue !== "undefined" ? editorParams.defaultValue : []),
	input = document.createElement("input"),
	listEl = document.createElement("div"),
	multiselect = ! (editorParams.multiselect === false),
	dataItems = [],
	currentItem = {},
	currentItems = [],
	blurable = true,
	blockListShow = false,
	searchWord = "",
	searchWordTimeout = null;


	function getUniqueColumnValues(field){        
        var params = {"conj": conjunction_tk,
                      "active_only": false,
                      "sep": ",",
                      "with_full": false,
                      "first_only": false,
                      "show_counts": true};
        if (editorParams["simple"]){
            params["conj"] = false;
            params["sep"] = false;
            params["with_full"] = true;
        }            
        let pk = Object.keys(params);
        for (let i = 0; i < pk.length; i += 1) {
            if (editorParams.hasOwnProperty(pk[i])){
                params[pk[i]] = editorParams[pk[i]];
            }
        }
        if (editorParams.hasOwnProperty("sort_values")){
                params["sort_values"] = editorParams["sort_values"];
        } else if ( params["show_counts"]) {
            params["sort_values"] = "nzfirst";
        } else {
            params["sort_values"] = "asc";
        }
        
		var output = [],
		    column;
        var data = [];
        var act_pos = [];
        self.table.getRows().forEach(function(row){
            data.push(row.getData());
            act_pos.push(row.getPosition(true));
        });

		if(field){
			column = self.table.columnManager.getColumnByField(field);
		}else{
			column = cell.getColumn()._getSelf();
		}

		if(column){            
            output_counts = getUniqueDataColumnPieces(data, column, act_pos, params["active_only"], params["sort_values"], params["sep"], params["first_only"], params["with_full"]);
		}else{
			console.warn("unable to find matching column to create select lookup list:", field);
		}
        if(typeof params["conj"] === 'string'){
            output_counts[0].unshift(params["conj"]);
        }
        if(! params["show_counts"]){
            output_counts[1] = {};
        }

		return output_counts;
	}


	function fillList(displayItems, currentValues=[]){

		while(listEl.firstChild) listEl.removeChild(listEl.firstChild);

		displayItems.forEach(function(item){

			var el = item.element;

			if(!el){
				el = document.createElement("div");
				item.label = editorParams.listItemFormatter ? editorParams.listItemFormatter(item.value, item.label, cell, el, item.itemParams) : item.label;
				if(item.group){
					el.classList.add("tabulator-edit-select-list-group");
					el.tabIndex = 0;
					el.innerHTML = item.label === "" ? "&nbsp;" : item.label;
				}else{
					el.classList.add("tabulator-edit-select-list-item");
					el.tabIndex = 0;
					el.innerHTML = item.label === "" ? "&nbsp;" : item.label;

					el.addEventListener("click", function(){
						blockListShow = true;

						setTimeout(() => {
							blockListShow = false;
						}, 10);

						// setCurrentItem(item);
						// chooseItem();
						if(multiselect){
							toggleItem(item);
							input.focus();
						}else{
							chooseItem(item);
						}

					});

					// if(item === currentItem){
					// 	el.classList.add("active");
					// }

					if(currentValues.indexOf(item.value) > -1){
                        currentItems.push(item);
						el.classList.add("active");
					}
				}


				el.addEventListener("mousedown", function(){
					blurable = false;

					setTimeout(function(){
						blurable = true;
					}, 10);
				});

				item.element = el;


			}

			listEl.appendChild(el);
		});
	}


	function setCurrentItem(item, active){

		if(!multiselect && currentItem && currentItem.element){
			currentItem.element.classList.remove("active");
		}

		if(currentItem && currentItem.element){
			currentItem.element.classList.remove("focused");
		}

		currentItem = item;

		if(item.element){
			item.element.classList.add("focused");
			if(active){
				item.element.classList.add("active");
			}
		}

		// if(item && item.element && item.element.scrollIntoView){
		// 	item.element.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
		// }
	}


	// function chooseItem(){
	// 	hideList();

	// 	if(initialValue !== currentItem.value){
	// 		initialValue = currentItem.value;
	// 		success(currentItem.value);
	// 	}else{
	// 		cancel();
	// 	}
	// }

	function setItem(item) {
		var index = currentItems.indexOf(item);

		if(index == -1){
			currentItems.push(item);
			setCurrentItem(item, true);
		}

		fillInput();
	}

	function unsetItem(index) {
		var item = currentItems[index];

		if(index > -1){
			currentItems.splice(index, 1);
			if(item.element){
				item.element.classList.remove("active");
			}
		}
	}

	function toggleItem(item) {
		if(!item){
			item = currentItem;
		}

		var index = currentItems.indexOf(item);

		if(index > -1){
			unsetItem(index);
		}else{
			if(multiselect !== true && currentItems.length >= multiselect){
				unsetItem(0);
			}

			setItem(item);
		}

		fillInput();

	}

	function chooseItem(item){
		hideList();

		if(!item){
			item = currentItem;
		}

		if(item){
			input.value = item.label;
			success(item.value);
		}

		initialDisplayValue = [item.value];
	}


	function chooseItems(silent){
		if(!silent){
			hideList();
		}

		var output = [];
        var idxs = {}
		currentItems.forEach((item) => {
			output.push(item.value);
            idxs[item.value] = dataItems.indexOf(item);
		});
        output.sort(function(a, b){return idxs[a]-idxs[b]});
        
		initialDisplayValue = output;

		success(output);
	}

	function fillInput(){

		var output = [];
        var idxs = {}
		currentItems.forEach((item) => {
			output.push(item.value);
            idxs[item.value] = dataItems.indexOf(item);
		});
        output.sort(function(a, b){return idxs[a]-idxs[b]});

		input.value = output.join(", ");

		if(self.currentCell === false){
			chooseItems(true);
		}
	}


	function unsetItems() {

		var len = currentItems.length;

		for(let i = 0; i < len; i++){
			unsetItem(0);
		}
	}

	function cancelItem(){
		hideList();
		cancel();
	}

	function showList(){
		if(!listEl.parentNode){
            currentItems = [];
		    dataItems = [];
            
			vals_counts = getUniqueColumnValues();
            vals_counts[0].forEach(function(value){
			    var item;
                let cnt = "";
                if (vals_counts[1].hasOwnProperty(value)){
                    cnt = " ("+vals_counts[1][value]+")";
                }                    
			    item = {
				    label:value+cnt,
				    value:value,
				    element:false,
			    };
            
			    dataItems.push(item);
		    });
		    fillList(dataItems, initialDisplayValue);

			//var offset = Helpers.elOffset(cellEl);
            var box = cellEl.getBoundingClientRect();
            var offset = {
                top: box.top + window.pageYOffset - document.documentElement.clientTop,
                left: box.left + window.pageXOffset - document.documentElement.clientLeft
            };

            
			listEl.style.minWidth = cellEl.offsetWidth + "px";

			listEl.style.top = (offset.top + cellEl.offsetHeight) + "px";
			listEl.style.left = offset.left + "px";


			listEl.addEventListener("mousedown", function(e){
				blurable = false;

				setTimeout(function(){
					blurable = true;
				}, 10);
			});

			document.body.appendChild(listEl);
		}
	}

	function hideList(){
		if(listEl.parentNode){
			listEl.parentNode.removeChild(listEl);
		}

		removeScrollListener();
	}

	function removeScrollListener() {
		self.table.rowManager.element.removeEventListener("scroll", cancelItem);
	}

	function scrollTovalue(char){

		clearTimeout(searchWordTimeout);

		var character = String.fromCharCode(event.keyCode).toLowerCase();
		searchWord += character.toLowerCase();

		var match = dataItems.find((item) => {
			return typeof item.label !== "undefined" && item.label.toLowerCase().startsWith(searchWord);
		});

		if(match){
			setCurrentItem(match, !multiselect);
		}

		searchWordTimeout = setTimeout(() => {
			searchWord = "";
		}, 800)
	}

	//style input
	input.setAttribute("type", "text");

	input.style.padding = "4px";
	input.style.width = "100%";
	input.style.boxSizing = "border-box";
	input.style.cursor = "default";
	input.readOnly = (this.currentCell != false);

	input.value = typeof initialValue !== "undefined" || initialValue === null ? initialValue : "";
    
	input.addEventListener("search", function(e){
		if(!input.value){
			unsetItems();
			chooseItems();
		}
	});

	//allow key based navigation
	input.addEventListener("keydown", function(e){
		var index;

		switch(e.keyCode){
			case 38: //up arrow
			index = dataItems.indexOf(currentItem);

			if(vertNav == "editor" || (vertNav == "hybrid" && index)){
				e.stopImmediatePropagation();
				e.stopPropagation();
				e.preventDefault();

				if(index > 0){
					setCurrentItem(dataItems[index - 1], !multiselect);
				}
			}
			break;

			case 40: //down arrow
			index = dataItems.indexOf(currentItem);

			if(vertNav == "editor" || (vertNav == "hybrid" && index < dataItems.length - 1)){
				e.stopImmediatePropagation();
				e.stopPropagation();
				e.preventDefault();

				if(index < dataItems.length - 1){
					if(index == -1){
						setCurrentItem(dataItems[0], !multiselect);
					}else{
						setCurrentItem(dataItems[index + 1], !multiselect);
					}
				}
			}
			break;

			case 37: //left arrow
			case 39: //right arrow
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			break;

			case 13: //enter 32-> space
			// chooseItem();
			if(multiselect){
				toggleItem();
			}else{
				chooseItem();
			}

			break;

			case 27: //escape
			cancelItem();
			break;
            
			case 9: //tab
			break;

			default:
			if(self.currentCell === false){
				e.preventDefault();
			}

			if(e.keyCode >= 38 && e.keyCode <= 90){
				scrollTovalue(e.keyCode);
			}
		}
	});

	input.addEventListener("blur", function(e){
		if(blurable){
			if(multiselect){
				chooseItems();
			}else{
				cancelItem();
			}
		}
	});

	input.addEventListener("focus", function(e){
		if(!blockListShow){
			showList();
		}
	});

	input.addEventListener("dblclick", function(e){
        var openedL = listEl.parentNode;
		unsetItems();
        input.value = "";
        chooseItems(false);
        if(openedL){
            showList();
        }
	});

    
	//style list element
	listEl = document.createElement("div");
	listEl.classList.add("tabulator-edit-select-list");

	onRendered(function(){
		input.style.height = "100%";
		input.focus({preventScroll: true});
	});

	setTimeout(() => {
		this.table.rowManager.element.addEventListener("scroll", cancelItem);
	}, 10);

	return input;
};
fmt_map["fmt_custSelectFilterEditor"] = custSelectFilterEditor;


//custom max min header filter
function minMaxFilterEditor(cell, onRendered, success, cancel, editorParams){

    var end;

    var container = document.createElement("span");
    var tbl = this.table;
    var column = cell.getColumn()._getSelf();
    
    var min_max = [1950, 2050];
    
    //create and style inputs
    var start = document.createElement("input");
    start.setAttribute("type", "number");
    start.setAttribute("placeholder", "Min");
    start.setAttribute("min", min_max[0]);
    start.setAttribute("max", min_max[1]);
    start.style.padding = "4px";
    start.style.width = "50%";
    start.style.boxSizing = "border-box";

    start.value = cell.getValue();

    function updateRange(e){
        if (tbl.initialized){
            var vals_counts = getUniqueDataColumnPieces(tbl.getData("active"), column, sort_values="asc", sep=false);
            min_max = [vals_counts[0][0], vals_counts[0][vals_counts[0].length-1]];
            e.target.setAttribute("min", min_max[0]);
            e.target.setAttribute("max", min_max[1]);
        }
    }
    
    function buildValues(){
        success({
            start:start.value,
            end:end.value,
        });
    }

    function keypress(e){
		if(e.keyCode == 38){ //up arrow
            if (e.target.value == ""){
                e.target.value = e.target.max;
            }
        }
		if(e.keyCode == 40){ //down arrow
            if (e.target.value == ""){
                e.target.value = e.target.min;
            }
        }
        if(e.keyCode == 13){
            buildValues();
        }

        if(e.keyCode == 27){
            cancel();
        }
    }
    
    end = start.cloneNode();
    end.setAttribute("placeholder", "Max");
    end.setAttribute("min", min_max[0]);
    end.setAttribute("max", min_max[1]);
    end.style.padding = "4px";

    start.addEventListener("focus", updateRange);
    start.addEventListener("change", buildValues);
    start.addEventListener("blur", buildValues);
    start.addEventListener("keydown", keypress);

    end.addEventListener("focus", updateRange);
    end.addEventListener("change", buildValues);
    end.addEventListener("blur", buildValues);
    end.addEventListener("keydown", keypress);


    container.appendChild(start);
    container.appendChild(end);

    return container;
}
fmt_map["fmt_minMaxFilterEditor"] = minMaxFilterEditor;

//custom max min filter function
function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams){
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row
    //rowData - the data for the row being filtered
    //filterParams - params object passed to the headerFilterFuncParams property

    if (rowValue){
        if (headerValue.start != ""){
            if (headerValue.end != ""){
                return rowValue >= headerValue.start && rowValue <= headerValue.end;
            } else {
                return rowValue >= headerValue.start;
            }
        } else {
            if (headerValue.end != ""){
                return rowValue <= headerValue.end;
            }
        }
    }

    return true; //must return a boolean, true if it passes the filter.
}
fmt_map["fmt_minMaxFilterFunction"] = minMaxFilterFunction;

// given a string s and pattern patt
// if patt starts with "/" turn into a regex and try to match s
// else test for equality
function checkString(s, patt){
    let prts = patt.split("/")
    if ( patt[0] == "/" && prts.length > 1){
        let regex = new RegExp(prts[1]);
        if ( prts.length > 2){
            let regex = new RegExp(prts[1], prts[2]);
        }
        return s.match(regex) != null;
    } else {
        return s == patt;
    }
}


// if options is an array, checks whether it contains s
// if options is a string, test s against it
// else return defv as default result
function checkOptions(s, options, defv=true){
    if ( Array.isArray(options) ) {
        return options.includes(s);
    } else if ( typeof options === 'string' ) {
        return checkString(s, options)
    }
    return defv;
}


// Given an array varr containing pairs (k, v) checks whether the value matches with k and returns v if it does
// If the unchanged original value is returned, status is -1
// If a default value (v associated to k="", if not "#SELF#") is returned, status is 0
function getVArr(value, varr){
    for (let i = 0; i < varr.length; i += 1) {
        if ( varr[i][0] == "" ){
            if ( varr[i][1] == "#SELF#" ) {
                return [value, -1];
            }
            return [varr[i][1], 0];
        } else if ( checkOptions(value, varr[i][0], false) ) {
            return [varr[i][1], 1];
        }
    }
    return [value, -1];
}

// Given a dictionnary checks whether the value is among the keys and returns the corresponding value
// If the unchanged original value is returned, status is -1
// If a default value (v associated to k="", if not "#SELF#") is returned, status is 0
function getVDict(value, vdict){
    if ( vdict.hasOwnProperty(value) ){
        return [vdict[value], 1];
    }
    else if ( vdict.hasOwnProperty("") ){
        if ( vdict[""] == "#SELF#" ) {
            return [value, -1];
        }
        else {
            return [vdict[""], 0];
        }
    }
    return [value, -1];
}

function getMapped(value, vmap){
    if ( Array.isArray(vmap) ) {
        return getVArr(value, vmap);
    } else if ( isObject(vmap) ) {
        return getVDict(value, vmap);
    } else if ( typeof vmap == "string"){
        return [vmap, -1];
    }
    return [value, -1];
}

function mapFormatAlt(value, alt, params){
    let iconR = [value, -1];
    let valR = [value, -1];

    let props = [];
    let pclass = [];
    let pstyle = [];
    
    if ( params.hasOwnProperty("icons") ){
        iconR = getMapped(value, params["icons"]);
        valR = [iconR[0], -1];
    } else if ( params.hasOwnProperty("values") ){
        iconR = [value, -1];
        valR = getMapped(value, params["values"]);
    }

    if ( iconR[0].length == 0 && valR[0].length == 0 ){ // empty cell
        return ""
    }
    
    if ( iconR[1] >= 0 && iconR[0].length != 0 ){ // there is an icon...
        pclass = ["bi", "bi-"+ iconR[0]];
    }
    
    for (let i = 0; i < map_props.length; i += 1) {
        if ( params.hasOwnProperty(map_props[i]) ){
            vp = getMapped(alt, params[map_props[i]]);
            if (vp[0] != ""){
                if (map_props[i] == "class"){
                    pclass.push(vp[0]);
                }
                else if (map_props[i] == "style"){
                    pstyle.push(vp[0]);
                }
                else {
                    pstyle.push(map_props[i]+":"+vp[0]);
                }
            }
        }
    }
    if (pclass.length > 0){
        props.push("class='"+ pclass.join(" ") +"'");
    }
    if (pstyle.length > 0){
        props.push("style='"+ pstyle.join("; ") +"'");
    }
    if (props.length > 0){
        if ( iconR[1] >= 0 && iconR[0].length != 0 ){ // there is an icon...
            return "<i "+props.join(" ")+"></i>";
        }
        else {
            return "<span "+props.join(" ")+">"+ valR[0] +"</span>";
        }
    }
    return valR[0];   
}

// Formatter function using mapping substitutions
function formatterPrep(cell, formatterParams){ //plain text value
    return mapFormatAlt(cell.getValue(), cell.getValue(), formatterParams);
}    
fmt_map["fmt_formatterPrep"] = formatterPrep;

// Formatter function using mapping substitutions
function formatterPrepAlt(cell, formatterParams){ //plain text value
    return mapFormatAlt(cell.getValue(), cell.getRow().getData()[formatterParams["alt"]], formatterParams);
}    
fmt_map["fmt_formatterPrepAlt"] = formatterPrepAlt;

function formatterStripTags(cell, formatterParams){
    return cell.getValue().replace(/<([^\/][^>]+)>([^>]+)<\/[^>]+>/g, "$2");
}
fmt_map["fmt_formatterStripTags"] = formatterStripTags;

function accessorStripTags(value, data, type, params, column, row){
    return value.replace(/<([^\/][^>]+)>([^>]+)<\/[^>]+>/g, "$2");
}
fmt_map["fmt_accessorStripTags"] = accessorStripTags;

function accessorStripHtml(value, data, type, params, column, row){
    let prev_value = "";value;
    while ( value != prev_value){
        prev_value = value;
        value =  value.replace(/<([^\/][^>]+)>([^>]+)<\/[^>]+>/g, "$2");
    }
    return value
}
fmt_map["fmt_accessorStripHtml"] = accessorStripHtml;

    
function formatterTags(cell, formatterParams){
    let tclass = "searchtag";
    let rid = cell.getRow().getIndex();
    let val = cell.getValue();
    const regexp = new RegExp('<([^\/][^>]+)>([^>]+)<\/[^>]+>','g');
    const matches = val.matchAll(regexp);
    for (const match of matches) {
        let tag_name = match[1];
        let tag_content = match[2];
        if (! tags_keep_case.includes(tag_name)){
            tag_content = tag_content.toLowerCase();
        }
        if ( ! tags_set.hasOwnProperty(rid) ){
            tags_set[rid] = new Set();
        }
        tags_set[rid].add(mkTagString(tag_name, tag_content));

        if ( formatterParams["collect"] ) {
            if ( ! tags_index.hasOwnProperty(tag_name) ){
                tags_index[tag_name] = new Set();
            }
            tags_index[tag_name].add(tag_content);
        }
    }
    if ( formatterParams.hasOwnProperty("tclass") ) {
        tclass = formatterParams["tclass"];
    }
    if ( formatterParams.hasOwnProperty("onclickFnct") ) {
        return val.replace(regexp, "<span class='"+tclass+" "+tclass+"-$1' onclick=\""+formatterParams["onclickFnct"]+"('$1', '$2')\">$2</span>");
    }
    else {
        return val.replace(regexp, "<span class='"+tclass+" "+tclass+"-$1'>$2</span>");
    }
}
fmt_map["fmt_formatterTags"] = formatterTags;

function mkTagString(tag_name, tag_content){
    return tag_name+tag_mrk+tag_content;
}

// Accessor function using mapping substitutions
function accessorPrep(value, data, type, params, column, row){
    return mapFormatAlt(value, value, params);
}    
fmt_map["fmt_accessorPrep"] = accessorPrep;

//custom filter function
function multiInFilterFunction(headerValue, rowValue, rowData, filterParams){
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row
    //rowData - the data for the row being filtered
    //filterParams - params object passed to the headerFilterFuncParams property
    if (typeof rowValue === 'string'){
        var params = {"conj": null,
                      "sep": ",",                      
                      "with_full": false,
                      "first_only": false};
        if (filterParams["simple"]){
            params["conj"] = false;
            params["sep"] = false;
            params["with_full"] = true;
        }
        let pk = Object.keys(params);
        for (let i = 0; i < pk.length; i += 1) {
            if (filterParams.hasOwnProperty(pk[i])){
                params[pk[i]] = filterParams[pk[i]];
            }
        }
        
        let pieces = [];
        let mtcVs = [];
        let conj = (params["conj"] === true);
        let conj_tk = conjunction_tk;
        if(typeof params["conj"] === 'string'){
            conj_tk = params["conj"];
        }
        for (let i = 0; i < headerValue.length; i += 1) {
            if (headerValue[i] == conj_tk){
                conj = true;
            }
            else {
                mtcVs.push(headerValue[i]);
            }
        }
        if (mtcVs.length == 0){
            return true;
        }
        pieces = toPieces(rowValue,  params["sep"], params["first_only"], params["with_full"]);
        for (let i = 0; i < mtcVs.length; i += 1) {
            if (pieces.includes(mtcVs[i])){
                if ( ! conj ){
                    return true;
                }
            } else if ( conj ){
                return false;
            }
        }
        return conj;
    }
    return true; //must return a boolean, true if it passes the filter.
}
fmt_map["fmt_multiInFilterFunction"] = multiInFilterFunction;


//custom filter function
function mapFilterFunction(headerValue, rowValue, rowData, filterParams){    
    //headerValue - the value of the header filter element
    //rowValue - the value of the column in this row
    //rowData - the data for the row being filtered
    //filterParams - params object passed to the headerFilterFuncParams property
    if (rowValue){
        if (filterParams.hasOwnProperty("options") ) {
            if ( filterParams["options"].hasOwnProperty(headerValue) ){
                return checkOptions(rowValue, filterParams["options"][headerValue]);
            } else {
                return checkOptions(rowValue, headerValue);
            }            
        }
    }
    return true; //must return a boolean, true if it passes the filter.
}
fmt_map["fmt_mapFilterFunction"] = mapFilterFunction;

// Make link for page mentions
function formatterMentionLinks(cell, formatterParams){ //plain text value
    var s_out = "";
    //, cell.getValue(), formatterParams);
    if (cell.getValue()) {
        let p_in = cell.getValue().split(",");
        let p_out = [];
        for (let i = 0; i < p_in.length; i += 1) {
            if ( p_in[i].trim().match(/p\.[0-9]+/) ) {
                b = p_in[i].split(":");
                lpg = b[0].trim().slice(2);
                if (b.length == 1) {
                    ltxt = b[0];
                } else {
                    ltxt = b.slice(1).join(":");                    
                }
                p_out.push("<a class='mention-lnk' target='_blank' href='"+formatterParams["base_url"]+"#page="+lpg+"'>"+ltxt+"</a>");
            } else {
                p_out.push(p_in[i]);
            }            
        }
        s_out = p_out.join(", ");
    }
    return s_out;
}    
fmt_map["fmt_formatterMentionLinks"] = formatterMentionLinks;

function accessorMentionLinks(value, data, type, params, column, row){
    var s_out = "";
    //, cell.getValue(), formatterParams);
    if (value) {
        let p_in = value.split(",");
        let p_out = [];
        for (let i = 0; i < p_in.length; i += 1) {
            if ( p_in[i].trim().match(/p\.[0-9]+/) ) {
                b = p_in[i].split(":");
                lpg = b[0].trim().slice(2);
                if (b.length == 1) {
                    ltxt = b[0];
                } else {
                    ltxt = b.slice(1).join(":");                    
                }
                p_out.push(ltxt);
            } else {
                p_out.push(p_in[i]);
            }            
        }
        s_out = p_out.join(", ");
    }
    return s_out;
}
fmt_map["fmt_accessorMentionLinks"] = accessorMentionLinks;


// Make link for page mentions
function formatterCustTxtarea(cell, formatterParams){ //plain text value
    let pref = "";
    let suff = "";
    if ( formatterParams.hasOwnProperty("class") ) {
        pref = "<span class='"+formatterParams["class"]+"'>";
        suff = "</span>";
    }
    // cell.getElement().style.whiteSpace = "pre-wrap";
	return pref+emptyToSpace(sanitizeHTML(cell.getValue()))+suff;
}    
fmt_map["fmt_formatterCustTxtarea"] = formatterCustTxtarea;


function toolTipBibString(cell){
    return cell.getRow().getData().bib_string;
}
fmt_map["fmt_toolTipBibString"] = toolTipBibString;

function toolTipRefKey(cell){
    return cell.getRow().getData().ref_key;
}
fmt_map["fmt_toolTipRefKey"] = toolTipRefKey;

function toolTipStripTags(cell){
    return formatterStripTags(cell, null);
}
fmt_map["fmt_toolTipStripTags"] = toolTipStripTags;


// function copyBibString(e, cell){
//     alert(cell.getRow().getData().bib_string);
// }
// fmt_map["fmt_copyBibString"] = copyBibString;

function checkNull(value){
    return value === null;
}
fmt_map["fmt_checkNull"] = checkNull;


function hideCol(e, column){
    column.hide();
}
fmt_map["fmt_hideCol"] = hideCol;

function collapseSubCols(e, column){
    var subc = column.getSubColumns();
    for (let i = 1; i < subc.length; i += 1) {                
        subc[i].hide();
    }
}
fmt_map["fmt_collapseSubCols"] = collapseSubCols;

function expandSubCols(e, column){
    var subc = column.getSubColumns();
    for (let i = 0; i < subc.length; i += 1) {                
        subc[i].show();
    }
}
fmt_map["fmt_expandSubCols"] = expandSubCols;


//define row context menu
var hdMenu = [
    {
        label:"Hide",
        action: hideCol
    },
    ]
fmt_map["fmt_hdMenu"] = hdMenu;

// // format column title dynamically 
// function mapTitleFormatter(c, params){
//     return params
// }
// fmt_map["fmt_mapTitleFormatter"] = mapTitleFormatter;


// var fmtBike = {
//     "allowEmpty" :true,
//     "allowTruthy":true,
//     "tickElement":"<i class='bi bi-caret-right-square-fill'></i>",
//     "crossElement":"<i class='bi bi-bicycle'></i>",
// }
// fmt_map["fmt_fmtBike"] = fmtBike;

function mkInfoTooltip(doc, info_tooltip_lines){
    var infoT = doc.createElement('div');
    var infoI = doc.createElement('i');
    var infoM = doc.createElement('span');
    infoT.className = "info-tooltip";
    infoI.className = "bi bi-info-circle-fill";
    infoM.className = "info-tooltiptext";
    infoM.innerHTML = info_tooltip_lines.join("\n");
    infoT.appendChild(infoI);
    infoT.appendChild(infoM);
    return infoT;
}

// LAYOUT, (UN)PACK CELLS
// ---------------------------------------

function packTable(table, extend_c=0, reset_h=true){
    extendRetractCols(table, extend_c);
    if ( extend_c > 0 ){
        swapTableAllCellsClasses(table, reset_h, class_add=unpack_class, class_remove=pack_class, add_only_if_remove=false);
    } else if ( extend_c < 0 ){
        swapTableAllCellsClasses(table, reset_h, class_add=pack_class, class_remove=unpack_class, add_only_if_remove=false);
    }
    if (reset_h){
        table.rowManager.getElement().style.height = "";
    }
}

function packColumn(col, extend_c=0, reset_h=true){
    extendRetractCol(col, extend_c);
    if ( extend_c > 0 ){
        swapColumnAllCellsClasses(col, reset_h, class_add=unpack_class, class_remove=pack_class, add_only_if_remove=false);
    } else if ( extend_c < 0 ){
        swapColumnAllCellsClasses(col, reset_h, class_add=pack_class, class_remove=unpack_class, add_only_if_remove=false);
    }
    if (reset_h){
        col.getTable().rowManager.getElement().style.height = "";
    }
}

function packRow(row, extend_c=0, reset_h=true){
    if ( extend_c > 0 ){
        swapRowAllCellsClasses(row, reset_h, class_add=unpack_class, class_remove=pack_class, add_only_if_remove=false);
    } else if ( extend_c < 0 ){
        swapRowAllCellsClasses(row, reset_h, class_add=pack_class, class_remove=unpack_class, add_only_if_remove=false);
    }
    if (reset_h){
        row.getTable().rowManager.getElement().style.height = "";
    }
}

function packCell(cell, extend_c=0, reset_h=true){
    if ( extend_c > 0 ){
        swapCellClasses(cell, class_add=unpack_class, class_remove=pack_class, add_only_if_remove=false);
    } else if ( extend_c < 0 ){
        swapCellClasses(cell, class_add=pack_class, class_remove=unpack_class, add_only_if_remove=false);
    }
    if (reset_h){
        cell.getRow()._getSelf().reinitializeHeight();
        cell.getTable().rowManager.getElement().style.height = "";
    }
}


function extendRetractCols(table, extend_c=1){
    table.getColumns(function(col){
        extendRetractCol(col, extend_c);
    });
}
function extendRetractCol(col, extend_c=1){
    if ( extend_c > 0 ){
        col.setWidth(col._getSelf().maxWidth);
        // col.setWidth(true);
    } else if ( extend_c < 0 ) {
        col.setWidth(col._getSelf().minWidth);
    }
}


function swapTableAllCellsClasses(table, reset_h=true, class_add=null, class_remove=null, add_only_if_remove=false){
    table.getRows().forEach(function(row){
        swapRowAllCellsClasses(row, reset_h, class_add, class_remove, add_only_if_remove);
	});    
}

function swapRowAllCellsClasses(row, reset_h=true, class_add=null, class_remove=null, add_only_if_remove=false){
	row._getSelf().getCells().forEach(function(cell){
        swapCellClasses(cell, class_add, class_remove, add_only_if_remove)
    });
    if (reset_h){
        row._getSelf().reinitializeHeight();
    }
}

function swapColumnAllCellsClasses(col, reset_h=true, class_add=null, class_remove=null, add_only_if_remove=false){
	col._getSelf().getCells().forEach(function(cell){
        swapCellClasses(cell, class_add, class_remove, add_only_if_remove)
        if (reset_h){
            cell.getComponent().getRow()._getSelf().reinitializeHeight();
        }
	});
}

function swapCellClasses(cell, class_add=null, class_remove=null, add_only_if_remove=false){
    swapElClasses(cell.getElement(), class_add, class_remove, add_only_if_remove);
}    

function swapElClasses(element, class_add=null, class_remove=null, add_only_if_remove=false){
    if ( class_remove !== null && element.classList.contains(class_remove) ){
        element.classList.remove(class_remove);
    }
    else if ( add_only_if_remove ) {
        class_add = null;        
    }
    if ( class_add !== null && ! element.classList.contains(class_add) ){
        element.classList.add(class_add);
    }
}    


function packFromTop(table, field, topEl){    
    let extend_c = 0;
    if ( topEl.classList.contains(pack_top_mrk+unpack_class) ){
        swapElClasses(topEl, class_add=pack_top_mrk+pack_class, class_remove=pack_top_mrk+unpack_class)
        extend_c = -1;
    } else {
        swapElClasses(topEl, class_add=pack_top_mrk+unpack_class, class_remove=pack_top_mrk+pack_class)
        extend_c = 1;
    }
    if ( field == ".anonymous"){
        packTable(table, extend_c);
    } else {
        packColumn(table.getColumn(field), extend_c);
    }      
}



// ACTUALLY PREPARING THE TABLE
// ---------------------------------------

function mkTable(table_did, table_conf){

    var c_init = {};
    var custom_params = {};
    if ( table_conf.hasOwnProperty("custom_params") ) {
        custom_params = table_conf["custom_params"];
        delete table_conf["custom_params"];
    }
    if ( custom_params.hasOwnProperty("info_tooltip_lines") ){
        let infoT = mkInfoTooltip(document, custom_params["info_tooltip_lines"])
        document.getElementById("top-line").appendChild(infoT);
    }
    
    if ( custom_params.hasOwnProperty("top_title") ){
        document.title = custom_params["top_title"];
        let tit = document.createElement('h1');
        tit.className = "top-title";
        tit.id = "top-title";
        tit.innerHTML = custom_params["top_title"];
        document.getElementById("top-line").appendChild(tit);
    }
    if ( custom_params.hasOwnProperty("top_link") ){
        let lnk = document.createElement('span');
        lnk.className = "top-link";
        lnk.id = "top-link";
        lnk.innerHTML = custom_params["top_link"];
        document.getElementById("top-line").appendChild(lnk);
    }

    if ( custom_params.hasOwnProperty("mod_date") ){
        let md = document.createElement('span');
        md.className = "mod-date";
        md.id = "mod-date";
        md.innerHTML =  "Last updated on "+ custom_params["mod_date"].toDateString();
        document.getElementById("top-line").appendChild(md);
    }    


    var subcMap = {};
    var subcSelector = document.querySelector('#choice-subc');
    // default: current view
    var currentOption = document.createElement('option');
    currentOption.value = -1;
    currentOption.text = "";
    subcSelector.appendChild(currentOption);
    // all
    var currentOption = document.createElement('option');
    currentOption.value = "all";
    currentOption.text = "all";
    subcSelector.appendChild(currentOption);

    
    for (let j = 0; j < custom_params["export_subcs"].length; j++) {
        subcMap[custom_params["export_subcs"][j]["name"]] = j;
        // if ( ! ( custom_params["export_subcs"][j].hasOwnProperty("unavailable") && custom_params["export_subcs"][j]["unavailable"]) ){
        if ( ! custom_params["export_subcs"][j]["unavailable"] ){
            var currentOption = document.createElement('option');
            currentOption.value = j;
            currentOption.text = custom_params["export_subcs"][j]["name"];
            subcSelector.appendChild(currentOption);
        }
    }
    
    var table = new Tabulator(table_did, table_conf);
    
    table.on("tableBuilt", function() {
        // ONCE THE TABLE IS BUILT,
        // INITIALIZE ELEMENTS FOR TAG SEARCH
        c_init["viz"] = [];
        c_init["all"] = [];
        c_init["none"] = [];
        for (let j = 0; j < exp_formats.length; j++) {
            c_init[exp_formats[j]] = [];
        }        
        let cols = table.columnManager.columnsByIndex;
        for (let i = 0; i < cols.length; i++) {            
            c_init["viz"].push(cols[i].visible);
            c_init["all"].push(true);
            c_init["none"].push(false);
            for (let j = 0; j < exp_formats.length; j++) {
                if ( cols[i].definition.hasOwnProperty(exp_formats[j]) ) {
                    if ( cols[i].definition[exp_formats[j]] ) {
                        c_init[exp_formats[j]].push(true);
                    } else {
                        c_init[exp_formats[j]].push(false);
                    }
                } else {
                    c_init[exp_formats[j]].push(null);
                }
            }
        }
        const ts = Object.entries(tags_set);
        for (let i = 0; i < ts.length; i++) {
            let tt = [ mkTagString(tag_key_own, ts[i][0]) ];
            ts[i][1].forEach((value) => {
                tt.push(value);
            });
            tt.sort();            
            tags_str[ts[i][0]] = tt.join(tag_join);
        }
        
        var tagSelector = document.querySelector('#choice-tag');
        var currentOption = document.createElement('option');
        currentOption.value = -1;
        currentOption.text = " Tag index ";
        tagSelector.appendChild(currentOption);
        let all_options = [];
        const tag_cats = Object.entries(tags_index);
        for (let i = 0; i < tag_cats.length; i++) {
            if ( ! tags_choice_exclude.includes(tag_cats[i][0]) ){
                tag_cats[i][1].forEach((value) => {
                    all_options.push(mkTagString(tag_cats[i][0], value));
                } );
            }
        }
        all_options.sort();
        for (let i = 0; i < all_options.length; i++) {
            var currentOption = document.createElement('option');
            currentOption.value = all_options[i];
            currentOption.text = all_options[i];
            tagSelector.appendChild(currentOption);
        }

        var queryString = window.location.search;
        var urlParams = new URLSearchParams(queryString);
        if ( urlParams.has(tag_key) ) {
            addSearchTag(mkTagString(tag_key_own, urlParams.get(tag_key)));
        }
        // INITIALIZE ELEMENTS FOR TAG SEARCH
        if (table.modules.hasOwnProperty("columnCalcs") && table.modules["columnCalcs"].topElement !== null && typeof table.modules["columnCalcs"].topElement !== "undefined"){            
            let topEl = table.modules["columnCalcs"].topElement;            
            topEl.addEventListener("click", function(e){
                if (e.shiftKey){
                    let cnamedItem = e.target.attributes.getNamedItem("tabulator-field");
                    let field = ".anonymous";
                    if ( cnamedItem !== null){
                        field = cnamedItem.value;
                    }
                    packFromTop(table, field, topEl);
                }
            });                
        }
    });
    
    function doSearchTag(){
        var tagInput = document.querySelector('#input-tag');
        if (tagInput.value.length > 0){
            table.setFilter(tagFilter, {"tags": tagInput.value.split(tag_join), "patt_tags": tagInput.value});
        }
        else {
            table.clearFilter();
        }
    }
    
    // clear all filters
    document.getElementById("choice-tag").addEventListener("change", function(){
        var tagSelector = document.querySelector('#choice-tag');
        var tag_str = tagSelector.value;
        if (tagSelector.selectedIndex != 0){
            tagSelector.selectedIndex = 0;
        }
        addSearchTag(tag_str);
    });

    // clear all filters
    document.getElementById("input-tag").addEventListener("change", doSearchTag);
    document.getElementById("input-tag").addEventListener("click", doSearchTag);
    
    
    // clear all filters
    document.getElementById("clear-filters").addEventListener("click", function(){
        clearSearchTag();
        table.clearFilter(true);
    });

    // select all visible rows
    document.getElementById("select-visible").addEventListener("click", function(){
        table.selectRow("visible");
    });           

    
    // show columns
    document.getElementById("viz-subc").addEventListener("click", function(){
        if ( c_init.hasOwnProperty("viz") ) {
            if (subcSelector.value === "all" ){
                resetColsViz(table, c_init["all"]);
            } else if (subcSelector.value != -1 ){
                setColsViz(table, custom_params["export_subcs"][subcSelector.value]);
            }
            else {
                resetColsViz(table, c_init["viz"]);
            }
        }
    });

    //trigger copy of selection (or entire table) to clipboard
    document.getElementById("clp-subc").addEventListener("click", function(){
        doExport(table, c_init, subcSelector.value, "clipboard", custom_params["export_subcs"], custom_params["top_title"]);
    });

    // //trigger export of selection (or entire table) to csv file
    document.getElementById("csv-subc").addEventListener("click", function(){
        doExport(table, c_init, subcSelector.value, "csv", custom_params["export_subcs"], custom_params["top_title"]);
    });

    // //trigger export of selection (or entire table) to csv file
    document.getElementById("pdf-subc").addEventListener("click", function(){
        doExport(table, c_init, subcSelector.value, "pdf", custom_params["export_subcs"], custom_params["top_title"]);
    });

    
    // //trigger download of data.json file
    // document.getElementById("download-json").addEventListener("click", function(){
    //     table.download("json", "data.json");
    // });

    // //trigger download of data.xlsx file
    // document.getElementById("download-xlsx").addEventListener("click", function(){
    //     table.download("xlsx", "data.xlsx", {sheetName:"References"});
    // });

    // //trigger download of data.html file
    // document.getElementById("download-html").addEventListener("click", function(){
    //     table.download("html", "data.html");
    // });

    table.on('cellDblClick', (e, cell) => {
        row_db_click = cell.getRow();
        let field = cell.getColumn().getField() ? cell.getColumn().getField() : ".anonymous";
        if ( custom_params.hasOwnProperty("bib_dbclick") && custom_params["bib_dbclick"].hasOwnProperty(field)){
            doExport(table, c_init, subcMap[custom_params["bib_dbclick"][field]], "clipboard", custom_params["export_subcs"], custom_params["top_title"]);
        }
        else {
            doExport(table, c_init, subcSelector.value, "clipboard", custom_params["export_subcs"], custom_params["top_title"]);
        }
        row_db_click = null;
    });

    table.on('cellClick', (e, cell) => {
        let field = cell.getColumn().getField() ? cell.getColumn().getField() : ".anonymous";
        if (e.ctrlKey){
            cell.getRow().toggleSelect(); //toggle row selected state on row click
        }
        else if (e.altKey){
            if ( field != ".anonymous"){
                cell.getColumn().hide(); //toggle row selected state on row click
            }
        }
        else if (e.shiftKey){
            let extend_c = 1;
            if ( cell.getElement().classList.contains(unpack_class) ){
                extend_c = -1;
            }
            if ( field == ".anonymous"){
                packRow(cell.getRow(), extend_c);
                // packTable(table, extend_c);
                // packColumn(cell.getColumn(), extend_c);
            } else {
                packCell(cell, extend_c);
            }
        }        
    });    

}


function loadTable(content_tsv, conf_json, table_did){
    let mod_date = null;
    fetch(content_tsv,{ method: "HEAD" }
    ).then((res) => {
      if (res.ok) {
      	mod_date = new Date(res.headers.get('Last-Modified'));
      } else {
          console.log("Not OK");
      }
    });

    d3.json(conf_json)
        .then(
            function(table_conf){
                replaceRecurse(table_conf, fmt_map);
                d3.tsv(content_tsv)
                    .then(
                        function(data){
                            table_conf["custom_params"]["mod_date"] = mod_date;
                            table_conf["data"] = data;
                            mkTable(table_did, table_conf);
                        },
                        function(err) { console.log(err); } // Error: "It broke when reading csv data"
                    );
            },
            function(err) { console.log(err); } // Error: "It broke when reading csv data"
        );
        
        
        
}
