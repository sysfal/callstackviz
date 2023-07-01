function stripHex(line) {
    var index = line.indexOf("+");
    if (index != -1) line = line.substr(0, index);

    index = line.indexOf("@");
    if (index != -1) line = line.substr(0, index);

    return line;
}

function parseLine(line, methodOut) {
    var res = "";
    line = line.trim();

    //if (line.length == 0) return "----<br/>";

    if (line.startsWith("(") || line.startsWith("<")) {
        return "";
    }

    if (line == "Native stack trace unavailable.") return "";

    var dll = "";
    var method = "";
    var lineinfo = "";
    //var fixedLine = line.replace(/ >/g, "_>");
    //var eles = fixedLine.split(/\ +/);  // split on multiple spaces
    var eles = line.split(/\s{2,}/);  // split on multiple spaces
    dll = eles[0];
    if (eles.length > 1) method = eles[1];
    if (eles.length > 2) lineinfo = eles[2];

    dll = stripHex(dll);
    method = stripHex(method);

    //if (dll.endsWith(".dll" || dll.endsWith(".DLL"))) {
    //  dll = dll.substring(0, dll.length - 4);
    //}

    // remove namespaces if same as dll
    var dllAsNamespace = dll.replace(/\./g, "::");

    if (method.startsWith("Slb::")) {
        for (var j = 0; j < method.length && j < dllAsNamespace.length; j++) {
            var m = method[j];
            var d = dllAsNamespace[j];
            if (m.localeCompare(d)) {
                method = method.substr(j);
                break;
            }
        }
    }

    if (method != "") {
        method = dll + "::" + method;
    }

    res += method + "\n";

    methodOut.val = method;

    return res;
}

function parseStacktraces(text, traces) {
    //var traces = [];
    //var currentGraph = {};
    //currentGraph.methodDictionary = [];
    //currentGraph.traces = [];
    //graphs.push(currentGraph);

    var calling = false;

    var lines = text.split("\n");
    lines.forEach(function (line) {
        if (line.length == 0) {
            calling = false;
            return;  // continue
        }

        if (!line.startsWith(" ") && !line.startsWith("\t")) {
            calling = false;
            return;  // continue
        }

        var methodObj = {};
        methodObj.val = "";
        var lineRes = parseLine(line, methodObj);

        //var lineRes = parseLine(line, lastMethodDictionary, methodObj);
        ////
        // NEW add array to start
        // check elements in other arrays, if match then merge
        // start at top then keep merging until no merges
        /*if (methodDictionary.length == 0) {
            methodDictionary.push(lastMethodDictionary);
        } else {
            var found = false;
            for (var i = 0; i < methodDictionary.length; i++) {
                if (!contains(methodDictionary[i], method) && method != "") {
                    //methodDictionary.push(method);
                    //methodDictionary[method] = toDotName(method);
                    // union of 2 arrays
                    // if length less than length of both arrays then replace current array and return? maybe check other arrays and merge?
                }
            }
        }*/
        ////

        var method = methodObj.val;
        if (!calling) {
            var newTrace = [];
            traces.push(newTrace);
        }
        if (method != "") {
            traces[traces.length - 1].push(method);
        }
        calling = true;
    })
}
