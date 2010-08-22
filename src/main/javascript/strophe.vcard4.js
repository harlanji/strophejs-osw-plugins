/*

*/
(function() {
    Strophe.addConnectionPlugin('vcard', (function() {
	var that, init, connection, callbacks, logger, on_presence, on_message, on_iq, fetch, save;

	// A logger which uses the Firebug 'console'
	logger =  {
	    debug: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.debug('strophe.vcard: ');
		    console.debug(msg);
		}
	    },
	    info: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.info('strophe.vcard: ' + msg);
		}
	    },
	    error: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.error('strophe.vcard: ' + msg);
		}
	    }
	};

	/**
	 * Group: Functions
	 */

	/**
	 * PrivateFunction: on_iq
	 *
	 * Strophe callback invoked on a 'stanza' message
	 */
	on_iq = function(stanza) {
	    /*var jid, contact, nick;
	    jid = presence.getAttribute('from');

	    contact = connection.roster.get_contact(jid);
	    if (contact) {		
		nick = presence.getElementsByName('nick');
		if (nick.length === 1) {
		    contact.vcard = Strophe.getText(nick[1]);
		    logger.info(contact.vcard);
		}
		return true;
	    } 
	    return false;*/
	};
	
	/**
	 * Function: init
	 *
	 * Constructor for Strophe plugin
	 */
	init = function(conn) {
	    connection = conn;
	    Strophe.addNamespace('VCARD_TEMP',"vcard-temp");
	    Strophe.addNamespace('VCARD_TEMP_UPDATE',"vcard-temp:x:update");
	    Strophe.addNamespace('VCARD4',"http://onesocialweb.org/spec/1.0/vcard4");
	    Strophe.addNamespace('VCARD4_PUBLISH', Strophe.NS.VCARD4 + "#publish");
	    Strophe.addNamespace('VCARD4_MERGE', Strophe.NS.VCARD4 + "#merge");
	    Strophe.addNamespace('VCARD4_REMOVE', Strophe.NS.VCARD4 + "#remove");
	    connection.addHandler(on_iq, null, 'iq', null, null, null);
	};

	fetch = function(jid, callback) {
	    logger.info("Fetching vcard for " + jid);
	    connection.sendIQ($iq({
		'type': 'get',
		'to': jid,
		'xmlns': Strophe.NS.CLIENT
	    }).c('vCard', {
		'xmlns': Strophe.NS.VCARD_TEMP
	    }), function(stanza) {
		var photo;
		photo = $(stanza).find('PHOTO BINVAL');
		if (photo.length > 0) {
		    contact = connection.roster.get_contact(jid);
		    if (typeof(contact.avatar) === 'undefined') {
			contact.avatar = {}; 
		    }
		    contact.avatar.data = $(photo[0]).text();
		    logger.info("Invoking roster.callbacks.contact_changed");
		    connection.roster.callbacks.contact_changed(contact);
		}
		contact.vcard = stanza.getElementsByTagName('vCard')[0];
		if (typeof(callback) === 'Function') { callback(contact); }
	    });
	};

	/** 
	 * Function: save
	 *
	 * Save a VCard-4 contact. 
	 *
	 * Parameters:
	 * vcard (function) - A function which provides a VCard. This function is passed a <Strophe.Builder> object
	 */
	save = function(vcard) {
	    var iq = $iq({
		'type': 'set',
		'to': connecton.jid,
		'xmlns': Strophe.NS.CLIENT
	    }).c('publish', {
		'xmlns': Strophe.NS.VCARD4_PUBLISH
	    }).c('vcard', {
		'xmlns': 'urn:ietf:params:xml:ns:vcard-4.0'
	    });
	    vcard(iq);
	    connection.sendIQ(iq);	      
	};

	that = {};
	that.init = init;
	that.fetch = fetch;
	that.save = save;
	return that;
    }()))
}());
