/**
 * Transform an object prototype to array
 * Usefull for jack
 * TODO: implement it on Jack
 */
function object2Array(object) {
    var a = [];
    for (var i in object.prototype) {
        if (typeof object.prototype[i] == "function") {
            a.push(i);
        }
    }
    return a;
}

function toDom(string)
{
    if (window.DOMParser)
    {
        var parser = new DOMParser();
        return parser.parseFromString(string, "text/xml").documentElement;
    }
    else // Internet Explorer
    {
        var parser = new ActiveXObject("Microsoft.XMLDOM");
        parser.async = "false";
        parser.loadXML(string);
        return parser.documentElement;
    }
}
var rosterPlugin = Strophe._connectionPlugins["roster"];
module("plugins.Roster", {
           setup: function() {
               rosterPlugin.items = [];
               rosterPlugin.ver = null;
               rosterPlugin._callbacks = [];
           },
           teardown: function() {

           }
});

// shortcut access

// Qunit test with jack for mocking facility
function jackTest(name, fun) {
    test(name,
         function() {
             jack(
                 function() {
                     var mockConnection = jack.create("mockConnection", object2Array(Strophe.Connection));
                     fun(mockConnection);
                 }

             );
         }
        );
}
