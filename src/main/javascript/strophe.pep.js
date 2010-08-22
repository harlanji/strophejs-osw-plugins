/*
  Copyright 2009, François de Metz <francois@2metz.fr>
  Based on pubsub plugin: Copyright 2008, Stanziq  Inc.
*/
/**
 * Implement Personnal Eventing Protocol
 * http://xmpp.org/extensions/xep-0163.html
 * Need pubsub plugin
 */
Strophe.addConnectionPlugin('pep',
{
    _connection: null,
    /** Function: init
     * Plugin init
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init: function(conn)
    {
        this._connection = conn;
        Strophe.addNamespace('PEP_USER_LOCATION',
                             'http://jabber.org/protocol/geoloc');
        Strophe.addNamespace('PEP_USER_MOOD',
                             'http://jabber.org/protocol/mood');
        Strophe.addNamespace('PEP_USER_TUNE',
                             'http://jabber.org/protocol/tune');
    },
    /** Function: publishUserLocation
     * User Location
     * http://xmpp.org/extensions/xep-0080.html
     *
     * Parameters:
     *   (Json) data - data to publish {country: 'France', locality: 'Paris'}
     *   (Function) call_back - callback function
     */
    publishUserLocation : function(data, call_back)
    {
        this.publish(this._connection.jid, Strophe.NS.PEP_USER_LOCATION, "geoloc", data, call_back);
    },
    /** Function: publishUserMood
     * User Mood
     * http://xmpp.org/extensions/xep-0107.html
     *
     * Parameters:
     *   (Json) data - data to publish {text: 'Hello World', annoyed: null}
     *   (Function) call_back
     */
    publishUserMood: function(data, call_back)
    {
        this.publish(this._connection.jid, Strophe.NS.PEP_USER_MOOD, "mood", data, call_back);
    },
    /** Function: publishUserTune
     * User Tune
     * http://xmpp.org/extensions/xep-0118.html
     *
     * Parameters:
     *   (Json) data - data to publish. {artist: 'Yes', title: 'Heart of the Sunrise'}.
     *   (Function) call_back -
     */
    publishUserTune: function(data, call_back)
    {
        this.publish(this._connection.jid, Strophe.NS.PEP_USER_TUNE, "tune", data, call_back);
    },
    /** Function: publish
     * Publish and item to the given pep node.
     *
     * Parameters:
     *   (String) jid - The node owner's jid.
     *   (String) node -  The name of the pubsub node.
     *   (Array) items -  The list of items to be published.
     *   (Function) call_back - Used to determine if node
     *     creation was sucessful.
     */
    publish: function(jid, node, name, items, call_back)
    {
        var pubid = this._connection.getUniqueId(name);

        var publish_elem = Strophe.xmlElement("publish",
                                              [["node",
                                                node]]);
        var item = Strophe.xmlElement("item",[]);
        var entry = Strophe.xmlElement(name, [["xmlns", node]]);
        for (var i in items)
        {
            var el = Strophe.xmlElement(i);
            if (items[i])
            {
                var t = Strophe.xmlTextNode(items[i]+'');
                el.appendChild(t);
            }
            entry.appendChild(el);
        }
        item.appendChild(entry);
        publish_elem.appendChild(item);

        var pub = $iq({from:jid, type:'set', id:pubid});
        pub.c('pubsub', { xmlns:Strophe.NS.PUBSUB }).cnode(publish_elem);

        this._connection.addHandler(call_back,
                                    null,
                                   'iq',
                                    null,
                                    pubid,
                                    null);
        this._connection.send(pub.tree());

        return pubid;
    },
    /** Function: subscribeToUserLocation
     * Subscribe to user location
     *
     * Parameters:
     *   (String) to - jid node
     *   (Dictionary) options -  The configuration options for the  node.
     *   (Function) event_cb - Used to recieve subscription events.
     *   (Function) call_back - Used to determine if node
     *   creation was sucessful.
     */
    subscribeToUserLocation: function(to, options, event_cb, call_back)
    {
        return this.subscribe(this.connection.jid, to, Strophe.NS.PEP_USER_LOCATION, options, event_cb, call_back);
    },
    /** Function: subscribeToUserMood
     * Subscribe to user mood
     *
     * Parameters:
     *   (String) to - jid node
     *   (Dictionary) options -  The configuration options for the  node.
     *   (Function) event_cb - Used to recieve subscription events.
     *   (Function) call_back - Used to determine if node
     *   creation was sucessful.
     */
    subscribeToUserMood: function(to, options, event_cb, call_back)
    {
        return this.subscribe(this.connection.jid, to, Strophe.NS.PEP_USER_MOOD, options, event_cb, call_back);
    },
    /** Function: subscribeToUserTune
     * Subscribe to user tune
     *
     * Parameters:
     *   (String) to - jid node
     *   (Dictionary) options -  The configuration options for the  node.
     *   (Function) event_cb - Used to recieve subscription events.
     *   (Function) call_back - Used to determine if node
     *   creation was sucessful.
     */
    subscribeToUserTune: function(to, options, event_cb, call_back)
    {
        return this.subscribe(this.connection.jid, to, Strophe.NS.PEP_USER_TUNE, options, event_cb, call_back);
    },
    /** Function: subscribe
     * Alias of pubsub.subscribe
     */
    subscribe: function(jid,service,node,options, event_cb, call_back)
    {
        this._connection.pubsub.subscribe(jid,service,node,options, event_cb, call_back);
    }
});
