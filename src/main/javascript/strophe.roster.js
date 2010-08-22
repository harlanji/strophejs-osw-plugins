/*
  Copyright 2010, François de Metz <francois@2metz.fr>
Modified by Owen Griffin
*/

(function() {
    Strophe.addConnectionPlugin('roster', (function() {
	var that, init, connection, callbacks, version, logger, contacts, on_presence, on_iq, on_message, get_contact, parse_query, parse_contact, fetch, subscribe, unsubscribe, authorize, unauthorize, update_contact, set_callbacks, supports_versioning, status_changed;

	// A logger which uses the Firebug 'console'
	logger =  {
	    debug: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.debug('strophe.roster: ');
		    console.debug(msg);
		}
	    },
	    info: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.info('strophe.roster: ' + msg);
		}
	    },
	    error: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.error('strophe.roster: ' + msg);
		}
	    }
	};

	/**
	 * Group: Callbacks
	 */
	callbacks = {};

	/**
	 * Callback: presence_subscription_request
	 *
	 * Invoked when a subscription request is received
	 */
	callbacks.presence_subscription_request = function() {};

	/**
	 * Callback: contact_changed
	 * 
	 * Invoked when a contact has their details changed and needs to be re-drawn
	 */
	callbacks.contact_changed = function(contact) {};

	/**
	 * Group: Functions
	 */

	/**
	 * Function: set_callbacks
	 * 
	 * Overrides the default callbacks if they are specified.
	 */
	set_callbacks = function(callbks) {
	    if (typeof(callbks) !== 'undefined') {
		if (typeof(callbks.presence_subscription_request) !== 'undefined') {
		    logger.info("Overriding presence_subscription_request callback");
		    callbacks.presence_subscription_request = callbks.presence_subscription_request;
		}
		if (typeof(callbks.contact_changed) !== 'undefined') {
		    logger.info("Overriding contact_changed callback");
		    callbacks.contact_changed = callbks.contact_changed;
		}
	    }
	};

	/**
	 * Function: get_contact
	 *
	 * Returns a contact matching the specified jid
	 *
	 * Parameters:
	 * jid - The Jabber identifier of the contact
	 *
	 * Returns: 
	 * {
	 *   jid: '',
	 *   resources: [],
	 *   nickname: '',
	 *   avatar: {
	 *     url: '',
	 *     data: ''
         *   }
	 * }
	 */
	get_contact = function(jid) {
	    var index; 
	    for (index = 0; index < contacts.length; index = index + 1) {
		if (contacts[index].jid === jid) {
		    return contacts[index];
		}
	    }
	    return false;
	};

	status_changed = function(status) {
	    if (status === Strophe.Status.CONNECTED) {
		// Bind to event handlers
		connection.addHandler(on_presence, null, 'presence', null, null, null);
		connection.addHandler(on_iq, Strophe.NS.ROSTER, 'iq', "set", null, null);
		connection.addHandler(on_message, null, 'message', null, null, null);
		fetch();
	    } else if (status === Strophe.Status.DISCONNECTED) {
		// Remove any of the resources associated to all contacts
		(function() {
		    var index; 
		    for (index = 0; index < contacts.length; index = index + 1) {
			contacts[index].resources = [];
		    }	
		}());
	    }
	};

	/**
	 * PrivateFunction: on_presence
	 *
	 * Strophe callback invoked on a 'presence' message
	 */
	on_presence = function(presence) {
	    var jid, from, contact;
	    jid = presence.getAttribute('from');
	    from = Strophe.getBareJidFromJid(jid);
	    type = presence.getAttribute('type');
	    contact = get_contact(from);
	    if (contact) {		
		if (type === 'unavailable') {
		    logger.info('Removing resource ' + Strophe.getResourceFromJid(jid) + ' from ' + from);
		    // Remove the resource from the contact
		    delete contact.resources[Strophe.getResourceFromJid(jid)];
		    // Update the available attribute
		    contact.available = (function(resources) {
			var k, count;
			for (k in resources) {
			    if (resources.hasOwnProperty(k)) {
				count = count + 1;
			    }
			}
			return count > 0;
		    }(contact.resources));
		} else {
		    logger.info('Adding resource ' + Strophe.getResourceFromJid(jid) + '  to ' + from);
		    contact.resources[Strophe.getResourceFromJid(jid)] = {
			show : (presence.getElementsByTagName('show').length != 0) ? Strophe.getText(presence.getElementsByTagName('show')[0]) : "",
			status   : (presence.getElementsByTagName('status').length != 0) ? Strophe.getText(presence.getElementsByTagName('status')[0]) : "",
			priority : (presence.getElementsByTagName('priority').length != 0) ? Strophe.getText(presence.getElementsByTagName('priority')[0]) : ""	
		    };
		    contact.available = true;
		}
	    } else {
		// The contact is not part of the roster
		if (type === 'subscribe') {
		    callbacks.presence_subscription_request(jid);
		} else {
		    contact = {
			jid: from,
			name: from,
			resources: [],
			groups: [],
			available: true
		    };
		    contact.resources[Strophe.getResourceFromJid(jid)] = {
			show: '',
			status: '',
			priority: ''
		    };
		    contacts.push(contact);
		    logger.info('Invoking contact_changed callback');
		    callbacks.contact_changed(contact);
		}
	    }
	    
	    return true;
	};

	/**
	 * PrivateFunction: on_iq
	 *
	 * Strophe callback invoked on a 'iq' message
	 */
	on_iq = function(iq) {
	    connection.send($iq({type: 'result', id: iq.id, to: iq.from}));
	    parse_query(iq);
	    return true;
	};

	/**
	 * PrivateFunction: on_message
	 *
	 * Strophe callback invoked on a 'message' stanza.
	 */
	on_message = function(stanza) {
	    var jid, contact, nick, nickname;
	    jid = stanza.getAttribute('from');
	    contact = connection.roster.get_contact(jid);
	    if (contact) {
		nick = stanza.getElementsByTagName('nick');
		if (nick.length === 1) {
		    contact.nickname = Strophe.getText(nick[0]);
		    logger.info("Invoking contact_changed callback");
		    callbacks.contact_changed(contact);
		} 
		
	    }
	    return true;
	};

	/**
	 * PrivateFunction: parse_query

	 */
	parse_query = function(iq) {
	    var query, items;
	    query = iq.getElementsByTagName('query');
            if (query.length != 0) {
		version = query.item(0).getAttribute('ver');
		
		Strophe.forEachChild(query.item(0), 'item', function(item) {
		    parse_contact(item);
		});
            }
	};

	parse_contact = function(item) {
	    var jid, name, subscription, groups;
	    jid = item.getAttribute("jid");
            name = item.getAttribute("name");
            subscription = item.getAttribute("subscription");
            groups = [];
            
	    Strophe.forEachChild(item, 'group', function(group) {
		groups.push(Strophe.getText(group));
	    });
	    
            var item = get_contact(jid);
            if (!item) {
		logger.info("Adding contact " + jid);
		item = {
                    name         : name,
                    jid          : jid,
                    subscription : subscription,
                    groups       : groups,
                    resources    : {},
		    available    : false
		};
		contacts.push(item);
            } else {
		logger.info("Updating existing contact");
		item.name = name;
		item.subscription = subscription;
		item.groups = groups;
            }
	    logger.info("Invoking contact_changed callback");
	    callbacks.contact_changed(item);
	};
	
	/**
	 * Function: init
	 *
	 * Constructor for Strophe plugin
	 */
	init = function(conn) {
	    connection = conn;
	    version = 'unknown';
	    contacts = [];

            Strophe.addNamespace('ROSTER_VER', 'urn:xmpp:features:rosterver');
	};

	/**
	 * Function: update_contact
	 *
	 * Updates the details of a contact
	 */
	update_contact = function(jid, name, groups) {
	    var contact, iq;
	    contact = get_contact(jid);
	    if (contact) {
		var iq = $iq({
		    type: 'set'
		}).c('query', {
		    xmlns: Strophe.NS.ROSTER
		}).c('item', {
		    jid: contact.jid,
                    name: name || item.name,
                    subscription: item.subscription
		});
		for (var i = 0; i < (groups || item.groups).length; i++) {
		    iq.c('group').t((groups || item.groups)[i]).up();
		}
		connection.sendIQ(iq);
	    };
	};

	/**
	 * Function: fetch
	 * 
	 * Retrieves a list of contacts from the server
	 */
	fetch = function() {
	    logger.info("Fetching contacts");
            connection.sendIQ($iq({
		type: 'get',
		'id' : connection.getUniqueId('roster')
	    }).c('query', {
		xmlns: Strophe.NS.ROSTER
	    }), function(stanza) {
		parse_query(stanza);
	    });
	};

	/** 
	 * Function: subscribe
	 *
	 * Subscribe presence
	 *
	 * Parameters:
	 *     (String) jid
	 */
	subscribe = function(jid) {
            connection.send($pres({to: jid, type: "subscribe"}));
	};
	
	/** 
	 * Function: unsubscribe
	 *
	 * Unsubscribe presence
	 *
	 * Parameters:
	 *     (String) jid
	 */
	unsubscribe = function(jid) {
            connection.send($pres({to: jid, type: "unsubscribe"}));
	};
	
	/** 
	 * Function: authorize
	 *
	 * Authorize presence subscription
	 *
	 * Parameters:
	 *     (String) jid
	 */
	authorize = function(jid) {
            connection.send($pres({to: jid, type: "subscribed"}));
	};
	
	/** 
	 * Function: unauthorize
	 *
	 * Unauthorize presence subscription
	 *
	 * Parameters:
	 *     (String) jid
	 */
	unauthorize = function(jid) {
            connection.send($pres({to: jid, type: "unsubscribed"}));
	};

	/** 
	 * Function: supportVersioning
	 * return true if roster versioning is enabled on server
	 */
	supports_versioning = function() {
            return (connection.features && connection.features.getElementsByTagName('ver').length > 0);
	}

	that = {};
	that.init = init;
	that.set_callbacks = set_callbacks;
	that.get_contact = get_contact;
	that.fetch = fetch;
	that.unauthorize = unauthorize;
	that.authorize = authorize;
	that.unsubscribe = unsubscribe;
	that.subscribe = subscribe;
	that.update_contact = update_contact;
	that.supports_versioning = supports_versioning;
	that.statusChanged = status_changed;
	that.callbacks = callbacks;
	return that;
    }()))
}());
