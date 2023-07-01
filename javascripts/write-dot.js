function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}



function printTabs(number) {
    var res = "";
    for (var i = 0; i < number; i++) {
        res += "  ";
    }
    return res;
}

function printSubGraphs(subs, tabs) {
    var res = "";
    for (sub in subs) {
        //var l = Object.keys(subs[sub]).length;
        //if (l > 0) {
        var thisisthemethodname = subs[sub]["thisisthemethodname"];
        if (thisisthemethodname === undefined) {
            res += printTabs(tabs);
            res += "subgraph cluster_";
            var subName = toDotName(sub);
            res += subName + "\n";
            res += printTabs(tabs);
            res += "{\n";
            res += printTabs(tabs + 1);
            res += "label = \"" + sub + "\";\n";
            res += printSubGraphs(subs[sub], tabs + 1);
            res += printTabs(tabs);
            res += "}\n"
        } else {
            res += printTabs(tabs + 1);
            res += thisisthemethodname + " [label=\"" + sub + "\"];\n";
        }
    }
    return res;
}

function createDot(trace, dot) {
    var methodDictionary = [];
    for (var i = 0; i < trace.length; i++) {
        var method = trace[(i)];
        if (!contains(methodDictionary, method) && method != "") {
            methodDictionary[method] = toDotName(method);
        }
    }

    var res = "digraph {\n";
    res += "graph [nodesep=1, ranksep=1];\n";
    res += "node [shape=box,style=filled,fillcolor=white]\n";

    var subgraphs = [];

    var i = 0;
    for (key in methodDictionary) {
        //res += methodDictionary[key] + " [label=\"" + key + "\"];\n";

        // handle std::
        var method = key.replace(/std::/g, "std__");

        // ignore name spaces after <
        var n = method.indexOf("<");
        if (n != -1) {
            var end = method.substr(n);
            method = method.substr(0, n);
            end = end.replace(/::/g, "__");
            method = method.concat(end);
        }

        var subs = method.split("::");

        var lastsub = subgraphs;
        //for(sub in subs) {
        for (var i = 0; i < subs.length; i++) {
            var module = subs[i];

            module = module.replace(/std__/g, "std::");

            if (i < subs.length - 1) {
                if (!(module in lastsub)) {
                    lastsub[module] = [];
                }
            } else {
                var method = {};
                method["thisisthemethodname"] = methodDictionary[key];
                lastsub[module] = method;
            }
            lastsub = lastsub[module];
        }
    }

    res += printSubGraphs(subgraphs, 0);

    var edgeDict = [];

    for (var i = 0; i < trace.length - 1; i++) {
        //res += methodDictionary[trace[i+1]] + " -> " + methodDictionary[trace[(i)]] + ";\n";
        if (trace[(i)] == "" || trace[i + 1] == "") {
            continue;
        }
        var key = methodDictionary[trace[i + 1]] + "\n  -> " + methodDictionary[trace[(i)]];
        if (edgeDict.hasOwnProperty(key)) {
            edgeDict[key]++;
        } else {
            edgeDict[key] = 1;
        }
    }

    for (key in edgeDict) {
        res += key;
        res += " [penwidth=" + edgeDict[key] + "]";
        res += ";\n";
        // [label=\"" + edgeDict[key] + "\"];\n"  // edge labels kill js dot layout
    }

    res += "}\n"

    dot.value = res;
    //return res;
}

function toDotName(method) {
    // DotName += namespaces[i].Replace('\'', '_').Replace('`', '_').Replace('.', '_').Replace(':', '_').Replace('<', '_').Replace('>', '_').Replace(' ', '_').Replace('(', '_').Replace(')', '_').Replace('&', '_').Replace('*', '_').Replace(',', '_').Replace('?', '_').Replace('[', '_').Replace(']', '_');
    //var res = method.replace(/\\/\`/\./:/</>/ /,/)/>/g, "_");
    //var res = method.replace(/\\/\:/g, "_");
    var res = method.replace(/:/g, "_");
    res = res.replace(/`/g, "_");
    res = res.replace(/'/g, "_");
    res = res.replace(/~/g, "_");
    res = res.replace(/</g, "_");
    res = res.replace(/>/g, "_");
    res = res.replace(/,/g, "_");
    res = res.replace(/\./g, "_");
    res = res.replace(/\(/g, "_");
    res = res.replace(/\)/g, "_");
    res = res.replace(/=/g, "_");
    res = res.replace(/\$/g, "_");
    res = res.replace(/ /g, "_");
    res = res.replace(/\*/g, "_");
    res = res.replace(/-/g, "_");
    return res;
}
