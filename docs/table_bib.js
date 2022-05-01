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

function doExport(table, c_init, subcVal, exp_to, export_subcs){
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
            table.download("pdf", "data.pdf", {orientation:"landscape", title:"References"});
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

//custom max min header filter
function minMaxFilterEditor(cell, onRendered, success, cancel, editorParams){

    var end;

    var container = document.createElement("span");

    //create and style inputs
    var start = document.createElement("input");
    start.setAttribute("type", "number");
    start.setAttribute("placeholder", "Min");
    start.setAttribute("min", 1950);
    start.setAttribute("max", 2050);
    start.style.padding = "4px";
    start.style.width = "50%";
    start.style.boxSizing = "border-box";

    start.value = cell.getValue();

    function buildValues(){
        success({
            start:start.value,
            end:end.value,
        });
    }

    function keypress(e){
        if(e.keyCode == 13){
            buildValues();
        }

        if(e.keyCode == 27){
            cancel();
        }
    }

    end = start.cloneNode();
    end.setAttribute("placeholder", "Max");
    end.setAttribute("min", 1950);
    end.setAttribute("max", 2050);
    end.style.padding = "4px";
    
    start.addEventListener("change", buildValues);
    start.addEventListener("blur", buildValues);
    start.addEventListener("keydown", keypress);

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


function mkTable(table_did, table_conf){

    var c_init = {};
    var custom_params = {};
    if ( table_conf.hasOwnProperty("custom_params") ) {
        custom_params = table_conf["custom_params"];
        delete table_conf["custom_params"];
    }
    if ( custom_params.hasOwnProperty("info_tooltip_lines") ){
        infoT = mkInfoTooltip(document, custom_params["info_tooltip_lines"])
        document.getElementById("setup-table").appendChild(infoT);       
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
        doExport(table, c_init, subcSelector.value, "clipboard", custom_params["export_subcs"]);
    });

    // //trigger export of selection (or entire table) to csv file
    document.getElementById("csv-subc").addEventListener("click", function(){
        doExport(table, c_init, subcSelector.value, "csv", custom_params["export_subcs"]);
    });

    // //trigger export of selection (or entire table) to csv file
    document.getElementById("pdf-subc").addEventListener("click", function(){
        doExport(table, c_init, subcSelector.value, "pdf", custom_params["export_subcs"]);
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
            doExport(table, c_init, subcMap[custom_params["bib_dbclick"][field]], "clipboard", custom_params["export_subcs"]);
            
        }
        else {
            doExport(table, c_init, subcSelector.value, "clipboard", custom_params["export_subcs"]);
        }
        row_db_click = null;
    });

    table.on('cellClick', (e, cell) => {
        if (e.ctrlKey){
            cell.getRow().toggleSelect(); //toggle row selected state on row click
        }
        else if (e.altKey){
            cell.getColumn().hide(); //toggle row selected state on row click
        }

    });    
}


function loadTable(content_tsv, conf_json, table_did){
    fetch(content_tsv,{ method: "HEAD" }
    ).then((res) => {
      if (res.ok) {
      	let mod_date = new Date(res.headers.get('Last-Modified'));
          document.getElementById("mod-date").innerHTML = "Last updated on "+ mod_date.toDateString();
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
                            table_conf["data"] = data;
                            mkTable(table_did, table_conf);
                        },
                        function(err) { console.log(err); } // Error: "It broke when reading csv data"
                    );
            },
            function(err) { console.log(err); } // Error: "It broke when reading csv data"
        );
        
        
        
}
