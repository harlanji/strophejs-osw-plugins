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

jackTest("roster.get() should send IQ",
         function (mockConnection) {
             jack.expect("mockConnection.sendIQ")
                 .once();
             rosterPlugin.init(mockConnection);
             rosterPlugin.get("callback");
         });

jackTest("roster.get() should callback with empty array",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><query xmlns="jabber:iq:roster" /></iq>'));
                     }
                 );
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(
                 function(items) {
                     called++;
                     equals(items.length, 0, "items must be empty");
                 }
             );
             equals(called, 1, "roster.get() callback should be called");
         });
/**
 *  Test stanza came from RFC 3921 XMPP-IM
 */
jackTest("roster.get() should callback with roster items",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><query xmlns="jabber:iq:roster">'
                                         + '<item jid="romeo@example.net" '
                                         + 'name="Romeo" '
                                         + 'subscription="both">'
                                         + '<group>Friends</group>'
                                         + '</item>'
                                         + '<item jid="mercutio@example.org" '
                                         + 'name="Mercutio" '
                                         + 'subscription="from">'
                                         + '<group>Friends</group>'
                                         + '</item>'
                                         + '<item jid="benvolio@example.org" '
                                         + 'name="Benvolio" '
                                         + 'subscription="both">'
                                         + '<group>Friends</group>'
                                         + '</item></query></iq>'));
                     }
                 );
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(
                 function(items) {
                     called++;
                     equals(null, rosterPlugin.ver);
                     equals(items.length, 3, "3 items");
                     equals(Strophe._connectionPlugins["roster"].items.length, 3, "3 items");
                     equals(items[0].name, "Romeo");
                     equals(items[0].jid, "romeo@example.net");
                     equals(items[0].subscription, "both");
                     equals(items[0].groups.length, 1);
                     equals(items[0].groups[0], 'Friends');
                 });
             equals(called, 1, "roster.get() callback should be called");
         });

function getFeatures(rosterver)
{
    return toDom("<stream:features xmlns:stream='http://etherx.jabber.org/streams'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/><session xmlns='urn:ietf:params:xml:ns:xmpp-session'/>" + (rosterver ? "<ver xmlns='urn:xmpp:features:rosterver'><optional/></ver>" : "") +"</stream:features>");
}

jackTest("roster plugin say if roster versioning is enabled",
        function(mockConnection) {
            mockConnection.features = getFeatures(true);
            rosterPlugin.init(mockConnection);
            equals(true, rosterPlugin.supportVersioning(), "roster versioning should be enabled");
        });

jackTest("roster plugin say if roster versioning is not enabled",
        function(mockConnection) {
            mockConnection.features = getFeatures(false);
            rosterPlugin.init(mockConnection);
            equals(false, rosterPlugin.supportVersioning(), "roster versioning should be enabled");
        });

jackTest("roster.get() send ver if server support versioning",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .mock(
                     function(iq, callbacksuccess, callbackerror) {
                         equals(1, $(iq.tree()).find("query[ver='']").size(), 'iq query should have a ver attribute');
                         callbacksuccess(toDom('<iq type="result" />'));
                     }
                 );
             mockConnection.features = getFeatures(true);
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(
                 function(items) {
                     called++;
                     equals(0, items.length);
                 });
             equals(called, 1, "roster.get() callback should be called");
         });

jackTest("roster.get() send specified ver if server support versioning",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .mock(
                     function(iq, callbacksuccess, callbackerror) {
                         equals(1, $(iq.tree()).find("query[ver='ver1']").size(), 'iq query should have a ver attribute');
                         callbacksuccess(toDom('<iq type="result" />'));
                     }
                 );
             mockConnection.features = getFeatures(true);
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(
                 function(items) {
                     called++;
                     equals(1, items.length);
                 }, 'ver1', [{jid:'romeo@example.net'}]);
             equals(called, 1, "roster.get() callback should be called");
         });

jackTest("roster.get() accept ver and item arg and server return entire roster",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><query ver="ver2" xmlns="jabber:iq:roster"><item jid="romeo@example.net"/></query></iq>'));
                     }
                 );
             mockConnection.features = getFeatures(true);
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(
                 function(items) {
                     called++;
                     equals(items.length, 1);
                     equals(rosterPlugin.ver, 'ver2');
                 }, 'ver1', []);
             equals(called, 1, "roster.get() callback should be called");
         });

jackTest("on roster push, roster ver should be updated",
         function (mockConnection) {
             expect(3);
             jack.expect("mockConnection.addHandler")
                 .exactly("2 time").mock(function(callback, ns, type) {
                                             if (type == "iq") {
                                                 ok(callback(toDom('<iq type="set"><query xmlns="jabber:iq:roster" ver="ver4">'
                                                             + '<item jid="romeo@example.net" '
                                                             + 'name="Romeo" '
                                                             + 'subscription="both">'
                                                             + '<group>Friends</group>'
                                                             + '</item></query></iq>'), "handler should return true"));
                                             }
                                         });
             jack.expect("mockConnection.send")
                 .once();
             rosterPlugin.init(mockConnection);

             equals(rosterPlugin.items.length, 1);
             equals(rosterPlugin.ver, "ver4");
         });


jackTest("roster should addHandler on presence and iq roster on init",
         function (mockConnection) {
             jack.expect("mockConnection.addHandler")
                 .exactly("2 time").whereArgument(1).isOneOf(null, Strophe.NS.ROSTER)
                 .whereArgument(2).isOneOf("presence", "iq")
                 .whereArgument(3).isOneOf("set", null)
                 .whereArgument(4).is(null)
                 .whereArgument(5).is(null);
             rosterPlugin.init(mockConnection);
         });

jackTest("roster should be filled when received iq and send reply ",
         function(mockConnection) {
             jack.expect("mockConnection.addHandler")
                 .exactly("2 time").mock(function(callback, ns, type) {
                                             if (type == "iq") {
                                                 ok(callback(toDom('<iq type="set"><query xmlns="jabber:iq:roster">'
                                                             + '<item jid="romeo@example.net" '
                                                             + 'name="Romeo" '
                                                             + 'subscription="both">'
                                                             + '<group>Friends</group>'
                                                             + '</item></query></iq>'),"handler should return true"));
                                             }
                                         });
             jack.expect("mockConnection.send")
                 .once();
             rosterPlugin.init(mockConnection);
             equals(rosterPlugin.items.length, 1);
         });

jackTest("roster should be updated when received iq and update callback called",
         function(mockConnection) {
             var callbackIq = null;
             var called = 0;
             jack.expect("mockConnection.addHandler")
                 .exactly("2 time").mock(
                     function(callback, ns, type) {
                         if (type == "iq") {
                             callbackIq = callback;
                         }
                     });
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><query xmlns="jabber:iq:roster">'
                                         + '<item jid="romeo@example.net" '
                                         + 'name="Romeo" '
                                         + 'subscription="from">'
                                         + '<group>Friends</group>'
                                         + '</item></query></iq>'));
                     });
             rosterPlugin.init(mockConnection);
             rosterPlugin.registerCallback(
                 function(items) {
                     called++;
                     equals(1, items.length);
                 });
             rosterPlugin.get(function() {});
             ok(callbackIq(toDom('<iq type="set"><query xmlns="jabber:iq:roster">'
                           + '<item jid="romeo@example.net" '
                           + 'name="Romeo" '
                           + 'subscription="both">'
                           + '<group>Friends</group>'
                           + '</item></query></iq>')), "handler should return true"); equals(rosterPlugin.items.length, 1);
             equals("both", rosterPlugin.items[0].subscription);
             equals(called, 2);
             expect(6);
         }
        );

jackTest("roster should be handle presence of roster contact and update callback called",
         function(mockConnection) {
             var callbackPresence = null;
             jack.expect("mockConnection.addHandler")
                 .exactly("2 time").mock(
                     function(callback, ns, type) {
                         if (type == "presence") {
                             callbackPresence = callback;
                         }
                     });
             jack.expect("mockConnection.sendIQ")
                 .once()
                 .mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><query xmlns="jabber:iq:roster">'
                                         + '<item jid="romeo@example.net" '
                                         + 'name="Romeo" '
                                         + 'subscription="from">'
                                         + '<group>Friends</group>'
                                         + '</item></query></iq>'));
                     });
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(function() {});
             var called = 0;
             rosterPlugin.registerCallback(
                 function(items, item) {
                     called++;
                     equals(items.length, 1);
                     equals(items[0], item);
                 });
             same(rosterPlugin.items[0].resources, {});
             ok(callbackPresence(toDom('<presence from="romeo@example.net/test"><show>xa</show><status>Test</status><priority>42</priority></presence>')), "handler should return true");
             equals(rosterPlugin.items[0].resources['test'].show, "xa");
             equals(rosterPlugin.items[0].resources['test'].status, "Test");
             equals(rosterPlugin.items[0].resources['test'].priority, 42);
             ok(callbackPresence(toDom('<presence from="romeo@example.net/orchard" />')), "handler should return true");
             equals(rosterPlugin.items[0].resources['orchard'].show, "");
             equals(rosterPlugin.items[0].resources['orchard'].status, "");
             equals(rosterPlugin.items[0].resources['orchard'].priority, "");
             equals(called, 2, "update callback should be called 2 times");
         }
        );

jackTest("roster should be handle presence unavailable",
         function(mockConnection) {
             var callbackPresence = null;
             jack.expect("mockConnection.addHandler")
                 .exactly("2 time").mock(function(callback, ns, type) {
                                             if (type == "presence") {
                                                 callbackPresence = callback;
                                             }
                                         });
             jack.expect("mockConnection.sendIQ")
                 .exactly("1 time").mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><query xmlns="jabber:iq:roster">'
                                         + '<item jid="romeo@example.net" '
                                         + 'name="Romeo" '
                                         + 'subscription="from">'
                                         + '<group>Friends</group>'
                                         + '</item></query></iq>'));
                     });
             rosterPlugin.init(mockConnection);
             rosterPlugin.get(function() {});
             same({}, rosterPlugin.items[0].resources);
             ok(callbackPresence(toDom('<presence from="romeo@example.net/orchard"><show>xa</show><status>Test</status><priority>42</priority></presence>')), "handler should return true");
             equals(rosterPlugin.items[0].resources['orchard'].show, "xa");
             ok(callbackPresence(toDom('<presence from="romeo@example.net/orchard" type="unavailable" />')), "handler should return true");
             equals(rosterPlugin.items[0].resources['orchard'], null, "should be deleted");
         });

jackTest("roster should send presence subscribe on subscribe",
         function(mockConnection) {
             jack.expect("mockConnection.send")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<presence to='romeo@example.net' type='subscribe' xmlns='jabber:client'/>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin.subscribe('romeo@example.net');
             expect(1);
         });

jackTest("roster should send presence subscribed on authorize",
         function(mockConnection) {
             jack.expect("mockConnection.send")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<presence to='romeo@example.net' type='subscribed' xmlns='jabber:client'/>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin.authorize('romeo@example.net');
             expect(1);
         });

jackTest("roster should send presence unsubscribed on unauthorize",
         function(mockConnection) {
             jack.expect("mockConnection.send")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<presence to='romeo@example.net' type='unsubscribed' xmlns='jabber:client'/>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin.unauthorize('romeo@example.net');
             expect(1);
         });

jackTest("roster should send presence unsubscribe on unsubscribe",
         function(mockConnection) {
             jack.expect("mockConnection.send")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<presence to='romeo@example.net' type='unsubscribe' xmlns='jabber:client'/>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin.unsubscribe('romeo@example.net');
             expect(1);
         });

test("update method should throw exception if not item found",
     function() {
         try {
             rosterPlugin.update("test@example.net", null, null, null);
         } catch (e) {
             ok(true, "exception ok");
         }
         expect(1);
     });

jackTest("roster should send updated roster item on update",
         function(mockConnection) {
             jack.expect("mockConnection.sendIQ")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<iq type='set' xmlns='jabber:client'><query xmlns='jabber:iq:roster'>"
                                  + "<item jid='romeo@example.net' "
                                  + "name='Example' "
                                  + "subscription='both'>"
                                  + "<group>Foo</group><group>Bar</group>"
                                  + "</item></query></iq>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin._updateItem(toDom('<item jid="romeo@example.net" '
                                        + 'name="Romeo" '
                                        + 'subscription="both">'
                                        + '<group>Friends</group>'
                                        + '</item>'));
             rosterPlugin.update('romeo@example.net', 'Example', ["Foo", "Bar"]);
             expect(1);
         });

jackTest("roster update should not update groups if null value",
         function(mockConnection) {
             jack.expect("mockConnection.sendIQ")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<iq type='set' xmlns='jabber:client'><query xmlns='jabber:iq:roster'>"
                                  + "<item jid='romeo@example.net' "
                                  + "name='Example' "
                                  + "subscription='both'>"
                                  + "<group>Friends</group>"
                                  + "</item></query></iq>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin._updateItem(toDom('<item jid="romeo@example.net" '
                                        + 'name="Romeo" '
                                        + 'subscription="both">'
                                        + '<group>Friends</group>'
                                        + '</item>'));
             rosterPlugin.update('romeo@example.net', 'Example', null);
             expect(1);
         });

jackTest("roster update should not update name if null value",
         function(mockConnection) {
             jack.expect("mockConnection.sendIQ")
                 .once()
                 .mock(function(stanza) {
                           equals(stanza.toString(), "<iq type='set' xmlns='jabber:client'><query xmlns='jabber:iq:roster'>"
                                  + "<item jid='romeo@example.net' "
                                  + "name='Romeo' "
                                  + "subscription='both'/>"
                                  + "</query></iq>");
                       });
             rosterPlugin.init(mockConnection);
             rosterPlugin._updateItem(toDom('<item jid="romeo@example.net" '
                                        + 'name="Romeo" '
                                        + 'subscription="both">'
                                        + '<group>Friends</group>'
                                        + '</item>'));
             rosterPlugin.update('romeo@example.net', null, [], null);
             expect(1);
         });
