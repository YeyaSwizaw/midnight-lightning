// Functions to be initialised when map is loaded
var url_submit;
var expand_submit;
var add_point;
var add_line;

var root_node = null;

// Create a new tree node
function createNode(url, point) {
	var node = {"url": url, "point": point, "depth": 0," children": new Array()};
	return node;
}

// Attach some children to a tree node
function expand(curr, children) {
	for (var i = 0; i < children.length; i++) {
		children[i].depth = curr.depth + 1;
	}
	
    if(curr['children'] == null) {
        curr['children'] = children;
    } else {
	    curr['children'] = curr['children'].concat(children);
    }
}

// Get a list of all of the leaves of a tree
function getLeaves(node) {
    leaves = [];

    if(node['children'] == null) {
        return [node];
    }

    for(var i = 0; i < node['children'].length; i++) {
        leaves = leaves.concat(getLeaves(node['children'][i]));
    }

    return leaves;
}

// Get an ip from a url
function get_ip(url, callback) {
    $.ajax({
        url: 'iprequest.php',
        type: 'POST',
        data: { 'url': url }
    }).done(function(ip_msg) {
        callback(ip_msg);
    });
}

// Get the lat and long from a url
function get_lat_long(url, callback) {
    $.ajax({
        url: 'latlongrequest.php',
        type: 'POST',
        data: { 'domain': url }
    }).done(function(lat_long_msg) {
        var lat_long = lat_long_msg.split('\n');
        callback(lat_long[0], lat_long[1]);
    });
}

// Get the sites that link to a url
function get_linked_sites(url, callback) {
    $.ajax({
        url: 'refdomainsrequest.php',
        type: 'POST',
        data: { 'domain': url }
    }).done(function(ref_domains_msg) {
        var split_msg = ref_domains_msg.split('\n');
        var n = parseInt(split_msg[0]);
        callback(n, split_msg.slice(1, 1 + (n * 2)));
    });
}

require([
    "esri/map", 
    "esri/graphic", 
    "esri/Color", 
    "esri/InfoTemplate", 
    "esri/layers/GraphicsLayer", 
    "esri/geometry/Point", 
    "esri/geometry/Polyline", 
    "esri/symbols/SimpleMarkerSymbol", 
    "esri/symbols/SimpleLineSymbol", 
    "dojo/domReady!"], 
    
function(Map, Graphic, Color, InfoTemplate, GraphicsLayer, Point, Polyline, SimpleMarkerSymbol, SimpleLineSymbol) {
    // Create the esri map
    var map = new Map("map", {
        center: [-1.935736, 52.44528],
        zoom: 9,
        basemap: "dark-gray"
    });

    // Initialise function when the map is loaded
    map.on("load", function() {
        var layer = map.graphics;
        var lineLayer = new GraphicsLayer();
        map.addLayer(lineLayer);

        // Add a new point to the map
        add_point = function(lat, lon, url, ip) {
            var point = new Point(lon, lat);
            var symbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CIRCLE).setColor(new Color([200, 200, 200, 1.0]));
            var attr = { "URL": url, "IP": ip, "lat": lat, "lon": lon };
            var info = new InfoTemplate("Website Link", "URL: ${URL}<br/>IP: ${IP}<br/>Coordinates: (${lat}, ${lon})");

            var g = new Graphic(point, symbol, attr, info);
            layer.add(g);

            return point;
        }

        // Add a line to the map, connecting two points
        add_line = function(p1, p2) {
            var line = new Polyline([[p1.getLongitude(), p1.getLatitude()], [p2.getLongitude(), p2.getLatitude()]]);
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([200, 200, 200, 1.0]), 2);

            var g = new Graphic(line, symbol);
            lineLayer.add(g);
        }

        // Search for the given url and place it on the map
        url_submit = function() {
            var url = document.getElementById('url-box').value;

            get_ip(url, function(ip) {
                get_lat_long(url, function(lat, lon) {
                    layer.clear();
                    var p = add_point(lat, lon, url, ip);
                    map.centerAndZoom(p, 9);

                    root_node = createNode(url, p);
                });
            });
        }

        // Search for links to the tree sites and expand them
        expand_submit = function() {
            if(root_node != null) {
                var leaves = getLeaves(root_node);

                for(var i = 0; i < leaves.length; i++) {
                    var url = leaves[i]['url'];
                    console.log(url);

                    (function(leaf) {
                        get_linked_sites(leaf['url'], function(n, list) {
                            console.log(n)
                            for(var i = 0; i < n; i += 2) {
                                var new_url = list[i];
                                var new_ip = list[i + 1];

                                (function(new_url, new_ip) {
                                    get_lat_long(new_url, function(lat, lon) {
                                        var p = add_point(lat, lon, new_url, new_ip);
                                        expand(leaf, [createNode(new_url, p)]);

                                        add_line(leaf['point'], p);
                                    });
                                })(new_url, new_ip);
                            }
                        });
                    })(leaves[i]);
                }
            }
        }

        // Attach the submit functions to the buttons
        document.forms['url-form'].action = "javascript:url_submit()";
        document.forms['expand-form'].action = "javascript:expand_submit()";
    })
});
