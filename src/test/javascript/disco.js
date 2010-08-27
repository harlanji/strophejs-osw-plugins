module("plugins.Disco");
var discoPlugin = Strophe._connectionPlugins["disco"];
test("add identity",
     function()
     {
         ok(discoPlugin.addIdentity("conference", "text"));
         ok(discoPlugin.addIdentity("directory", "chatroom"));
         equals(true, discoPlugin.addIdentity("conference", "chat", "MUC server"));
         equals(false, discoPlugin.addIdentity("conference", "chat", "MUC server"));
         equals(true, discoPlugin.addIdentity("directory", "chatroom", "MUC server", "en-US"));
         equals(true, discoPlugin.addIdentity("directory", "chatroom", "MUC serveur", "fr-FR"));
         equals(false, discoPlugin.addIdentity("directory", "chatroom", "MUC serveur", "fr-FR"));
     }
    );

test("add feature",
     function() {
         ok(discoPlugin.addFeature("jabber:iq:version"));
         ok(discoPlugin.addFeature("jabber:iq:time"));
         equals(false, discoPlugin.addFeature("jabber:iq:time"));
     }
    );

test("add item",
    function() {
        ok(discoPlugin.addItem('people.shakespeare.lit', 'Directory of Characters'));
        ok(discoPlugin.addItem('plays.shakespeare.lit', 'Play-Specific Chatrooms'));
        equals(false, discoPlugin.addItem('plays.shakespeare.lit', 'Play-Specific Chatrooms', 'chat'));
        ok(discoPlugin.addItem('plays.shakespeare.lit', 'Play-Specific Chatrooms', 'chat', function() {}));
    });

jackTest('Test iq get info features', function(mockConnection) {
    expect(10);
    jack.expect("mockConnection.send").once().mock(
                     function(iq) {
                         equals($(iq).attr('to'), 'romeo@montague.net/orchard');
                         equals($(iq).attr('id'), 'info1');
                         equals($(iq).find('query').attr('node'), undefined);
                         equals($(iq).find('query > identity').size(), 3);
                         equals($(iq).find('query > identity:first').attr('name'), undefined);
                         equals($(iq).find('query > identity[name="Neutron"]').size(), 2);
                         equals($(iq).find('query > identity[name="Neutron"]:first').attr('xml:lang'), undefined);
                         equals($(iq).find('query > identity[name="Neutron"]:last').attr('xml:lang'), 'fr-FR');
                         equals($(iq).find('query > feature').size(), 2);
                         equals($(iq).find('query > feature[var="jabber:iq:version"]').size(), 1);
                     });
    discoPlugin.init(mockConnection);
    discoPlugin.addIdentity('client', 'web');
    discoPlugin.addIdentity('automation', 'bot', 'Neutron');
    discoPlugin.addIdentity('automation', 'bot', 'Neutron', 'fr-FR');
    discoPlugin.addFeature('jabber:iq:version');
    discoPlugin.addFeature('jabber:iq:time');
    var xml = toDom("<iq type='get' from='romeo@montague.net/orchard' id='info1'><query xmlns='http://jabber.org/protocol/disco#info'/></iq>");
    discoPlugin._onDiscoInfo(xml);
});

jackTest('Test iq get info features with node attribute', function(mockConnection) {
    expect(5);
    jack.expect("mockConnection.send").once().mock(
                     function(iq) {
                         equals($(iq).attr('to'), 'romeo@montague.net/orchard');
                         equals($(iq).attr('id'), 'info1');
                         equals($(iq).find('query').attr('node'), 'http://jabber.org/protocol/commands');
                         equals($(iq).find('query > identity').size(), 3);
                         equals($(iq).find('query > feature').size(), 2);
                     });
    discoPlugin.init(mockConnection);
    discoPlugin.addIdentity('client', 'web');
    discoPlugin.addIdentity('automation', 'bot', 'Neutron');
    discoPlugin.addIdentity('automation', 'bot', 'Neutron', 'fr-FR');
    discoPlugin.addFeature('jabber:iq:version');
    discoPlugin.addFeature('jabber:iq:time');
    var xml = toDom("<iq type='get' from='romeo@montague.net/orchard' id='info1'><query xmlns='http://jabber.org/protocol/disco#info' node='http://jabber.org/protocol/commands'/></iq>");
    discoPlugin._onDiscoInfo(xml);
});

jackTest('Test get info features', function(mockConnection) {
             jack.expect("mockConnection.sendIQ").once();
    discoPlugin.init(mockConnection);
    discoPlugin.info(function() {}, 'test@example.com');
         });

jackTest('Test get items', function(mockConnection) {
             jack.expect("mockConnection.sendIQ").once();
    discoPlugin.init(mockConnection);
    discoPlugin.items(function() {}, 'test@example.com');
         });


jackTest('Test iq get items', function(mockConnection) {
    expect(9);
    jack.expect("mockConnection.send").once().mock(
                     function(iq) {
                         equals($(iq).find('query').attr('node'), undefined);
                         equals($(iq).attr('to'), 'romeo@montague.net/orchard');
                         equals($(iq).attr('id'), 'items1');
                         equals($(iq).find('query > item').size(), 3);
                         equals($(iq).find('query > item:first').attr('jid'), 'catalog.shakespeare.lit');
                         equals($(iq).find('query > item:first').attr('name'), 'Books');
                         equals($(iq).find('query > item').eq(1).attr('name'), undefined);
                         equals($(iq).find('query > item').eq(1).attr('node'), undefined);
                         equals($(iq).find('query > item:last').attr('node'), 'music');
                     });
    discoPlugin.init(mockConnection);
    discoPlugin.addItem('catalog.shakespeare.lit', 'Books');
    discoPlugin.addItem('play.shakespeare.lit');
             discoPlugin.addItem('catalog.shakespeare.lit', 'Music', 'music', function() {});
    var xml = toDom("<iq type='get' from='romeo@montague.net/orchard' id='items1'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>");
    discoPlugin._onDiscoItems(xml);
         });



jackTest('Test iq get items with node request', function(mockConnection) {
    expect(6);
    jack.expect("mockConnection.send").once().mock(
                     function(iq) {
                         equals($(iq).find('query').attr('node'), 'music');
                         equals($(iq).attr('to'), 'romeo@montague.net/orchard');
                         equals($(iq).attr('id'), 'items1');
                         equals($(iq).find('query > item').size(), 1);
                         equals($(iq).find('query > item:first').attr('jid'), 'catalog.shakespeare.lit');
                         equals($(iq).find('query > item:first').attr('name'), 'Chuck');
                     });
    discoPlugin.init(mockConnection);
    discoPlugin.addItem('catalog.shakespeare.lit', 'Books');
    discoPlugin.addItem('play.shakespeare.lit');
    discoPlugin.addItem('catalog.shakespeare.lit', 'Music', 'music', function(stanza) {
                            return [{jid: 'catalog.shakespeare.lit', name:'Chuck'}];
                                 });
    var xml = toDom("<iq type='get' from='romeo@montague.net/orchard' id='items1'><query xmlns='http://jabber.org/protocol/disco#items' node='music'/></iq>");
    discoPlugin._onDiscoItems(xml);
         });

