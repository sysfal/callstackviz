var fileElem = document.getElementById("fileElem"),
    callstacks_tab = document.getElementById("callstacks_tab"),
    dot_tab = document.getElementById("dot_tab"),
    debug_tab = document.getElementById("debug_tab"),
    graphs_tabs = document.getElementById("graphs_tabs"),
    graphs_nav_tabs = document.getElementById("graphs_nav-tabs"),
    graphs_list_tab = document.getElementById("graphs_list_tab");

var current_svg = null;
var graph_dots = [];

var dropbox;
dropbox = document.getElementById("drop-zone");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);

function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    handleFiles(files);
}

$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    var tab = $(e.target);
    var contentId = tab.attr("href");

    //This check if the tab is active
    if (tab.parent().hasClass('active')) {
        //console.log('the tab with the content id ' + contentId + ' is visible');

        if (contentId.startsWith("#graph_")) {
            var id_svg = contentId.substr(1) + "_svg";
            var svg = document.getElementById(id_svg);

            svgPanZoom(current_svg).destroy()

            svgPanZoom(svg, {
                zoomEnabled: true,
                controlIconsEnabled: true
            });

            current_svg = svg;

            var index = contentId.substr(7);
            dot_tab.innerHTML = "<pre><code>" + graph_dots[index] + "</code></pre>";
        }
    }
});

function parseHTML(html) {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t.content.cloneNode(true);
}

function updateSvg(text, id) {
    try {
        var dot = Viz(text);

        var svg2 = parseHTML(dot);
        var svg = svg2.childNodes[6];
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("style", "overflow: hidden; display: inline; width: inherit; min-width: inherit; max-width: inherit; height: inherit; min-height: inherit; max-height: inherit;");
        //svg.setAttribute("style", "overflow: hidden; display: inline; width: inherit; min-width: inherit; max-width: inherit; height: inherit; min-height: inherit; max-height: inherit;");
        var id_svg = id + "_svg";
        svg.setAttribute("id", id_svg);

        var p = document.getElementById(id);
        p.appendChild(svg);
    }
    catch (err) {
        document.getElementById("debug_tab").innerHTML = err.message;
    }
}

function handleFiles(files) {
    if (!files.length) {
        fileList.innerHTML = "<p>No files selected!</p>";
    } else {
        var file = files[0];
        var text = null;
        var reader = new FileReader();
        reader.onload = function (e) {
            var callstacks = reader.result;

            callstacks_tab.innerHTML = "<pre><code>" + callstacks + "</code></pre>";

            var traces = [];
            parseStacktraces(callstacks, traces);

            //console.log(traces);

            // merge traces
            var traces2 = [];
            traces2.push(traces[0])
            for (var j = 1; j < traces.length; j++) {
                var trace = traces[j];
                var trace_merge = null;
                for (var k = 0; k < trace.length; k++) {
                    var trace_method = trace[k];
                    // look though each current trace and add it found any same method
                    for (var i = 0; i < traces2.length; i++) {
                        var trace2 = traces2[i];

                        if (contains(trace2, trace_method)) {
                            trace_merge = trace2;
                            break;
                        }
                    }
                    if (!(trace_merge === null)) {
                        break;
                    }
                }
                if (trace_merge === null) {
                    traces2.push(traces[j]);
                } else {
                    trace2.push("");
                    trace2.push.apply(trace2, traces[j]);
                }
            }

            console.log(traces2);

            var graphs_dlls = [];
            // get list of dlls for each graph
            for (var j = 0; j < traces2.length; j++) {
                var dlls = [];
                var trace = traces2[j];
                for (var k = 0; k < trace.length; k++) {
                    var trace_method = trace[k];
                    var index = trace_method.indexOf(":");
                    var dll = trace_method.substr(0, index);
                    if (!(contains(dlls, dll))) {
                        dlls.push(dll);
                    }
                }
                //console.log(dlls);
                graphs_dlls.push(dlls);
            }

            console.log(dlls);

            var graph_list = "<ul>";
            for (var j = 0; j < graphs_dlls.length; j++) {
                var dll = graphs_dlls[j];
                graph_list += "<li>" + j + " : ";
                for (var k = 0; k < dll.length; k++) {
                    graph_list += dll[k] + " ";
                }
                graph_list += "</li>";
            }
            graph_list += "</ul>";
            graphs_list_tab.innerHTML = graph_list;

            // for each graph create tab and add svg
            for (var j = 0; j < traces2.length; j++) {
                var trace = traces2[j];

                var dot = [];
                createDot(trace, dot);

                //dot_tab.innerHTML = "<pre><code>" + dot.value + "</code></pre>";
                graph_dots.push(dot.value);

                //<li class="active"><a data-toggle="tab" href="#graph_0">graph_0</a></li>
                // <div id="graph_0" class="tab-pane fade in active" style="width:1000px;height:1000px">
                // <div id="graph_1" class="tab-pane fade">
                var id = "graph_" + j;
                var graph_nav_tab = document.createElement("li");
                var graph_nav_tab_a = document.createElement("a");
                graph_nav_tab_a.setAttribute("data-toggle", "tab");
                var id_a = "#" + id;
                graph_nav_tab_a.setAttribute("href", id_a);
                graph_nav_tab_a.innerText = j;
                graph_nav_tab.appendChild(graph_nav_tab_a);

                var graph_tab = document.createElement("div");
                graph_tab.setAttribute("style", "width:1000px;height:1000px");

                graph_tab.setAttribute("id", id);
                if (j == 0) {
                    graph_nav_tab.setAttribute("class", "active");
                    graph_tab.setAttribute("class", "tab-pane fade in active");
                } else {
                    graph_tab.setAttribute("class", "tab-pane fade");
                }
                graphs_nav_tabs.appendChild(graph_nav_tab);
                graphs_tabs.appendChild(graph_tab);

                updateSvg(dot.value, id);

                if (j == 0) {
                    var id_svg = id + "_svg";
                    var svg = document.getElementById(id_svg);
                    current_svg = svg;

                    svgPanZoom(svg, {
                        zoomEnabled: true,
                        controlIconsEnabled: true
                    });

                    dot_tab.innerHTML = "<pre><code>" + graph_dots[j] + "</code></pre>";
                }

                debug_tab.innerHTML = "<pre><code>" + dot + "</code></pre>";
            }
        }

        reader.onerror = function (err) {
            console.log(err, err.loaded
                , err.loaded === 0
                , file);
        }

        reader.readAsText(file);
    }
}
