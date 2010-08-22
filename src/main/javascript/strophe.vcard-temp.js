
var ContactRepository = function() {
    var that, data, get, add;

    data = [];

    /**
     * Function: add_vcard
     *
     * Adds a new VCard to the repository of vcards
     **/
    add = function(vcard) {
	// Ensure that the JID contains no resource
	vcard.jid = Strophe.getBareJidFromJid(vcard.jid);
	// Add the card to the repository
	data.push(vcard);
    }
    
    /**
     * Function: get
     * 
     * Returns a VCard for the given jid.
     *
     * Parameters:
     * jid - The JID of the VCard to fetch
     */
    get = function(jid) {
	var j, index;
	// Strip the resource from the JID
	j = Strophe.getBareJidFromJid(jid);
	// Iterate through the repository until a matching vcard is found
	for (index = 0; index < data.length; index = index + 1) {
	    if (data[index].jid === j) {
		return data[index];
	    }
	}
	return false;
    }

    that = {};
    that.add = add;
    that.get = get;
    return that;
};


/**
 * Strophe.js plugin for XEP-0054 and XEP-0153.
 * 
 * Depends: 
 * - JQuery
 * - strophe.roster.js
*/
(function() {
    Strophe.addConnectionPlugin('vcardtemp', (function(repo) {
	var that, init, connection, callbacks, logger, fetch, save, status_changed, on_presence, repository;

	// A logger which uses the Firebug 'console'
	logger =  {
	    debug: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.debug('strophe.vcard-temp: ');
		    console.debug(msg);
		}
	    },
	    info: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.info('strophe.vcard-temp: ' + msg);
		}
	    },
	    error: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.error('strophe.vcard-temp: ' + msg);
		}
	    }
	};

	repository = repo;

	/**
	 * Group: Functions
	 */
	
	/**
	 * Function: init
	 *
	 * Constructor for Strophe plugin
	 *
	 * Parameters:
	 * connection - A Strophe connection object
	 */
	init = function(conn, repo) {
	    connection = conn;
	    if (typeof(repo) !== 'undefined') {
		repository = repo;
	    }
	    Strophe.addNamespace('VCARD_TEMP',"vcard-temp");
	    Strophe.addNamespace('VCARD_TEMP_UPDATE',"vcard-temp:x:update");
	};	    
	    
	/**
	 * Function: statusChanged
	 *
	 * Invoked in the Strophe plugin framework when the connection status
	 * changes.
	 */
	status_changed = function(status) {
	    if (status === Strophe.Status.CONNECTED) {
		// Bind to event handlers
		logger.info("Binding on_presence handler")
		connection.addHandler(on_presence, null, 'presence', null, null, null);
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
	    if ($(presence).find('x').first().attr('xmlns') === Strophe.NS.VCARD_TEMP_UPDATE) {

		logger.info("VCard update for " + jid);
		contact = repository.get(from);
		if (contact) {
		    if (typeof(contact.avatar) === 'undefined' ||
			typeof(contact.avatar.md5) === 'undefined' ||
			contact.avatar.md5 !== $(presence).find('x photo').first().text()) {
			fetch(from);
		    }
		}
	    }
	    return true;
	};

	/**
	 * Function: fetch
	 *
	 * Fetches the VCard for a specified contact.
	 *
	 * Parameters:
	 * jid - The Jabber identifier for the user
	 * callback - A function to be invoked with a contact object
	 **/
	fetch = function(jid, callback) {
	    j = Strophe.getBareJidFromJid(jid);
	    logger.info("Fetching vcard for " + j);
	    connection.sendIQ($iq({
		'type': 'get',
		'to': j,
		'xmlns': Strophe.NS.CLIENT
	    }).c('vCard', {
		'xmlns': Strophe.NS.VCARD_TEMP
	    }), function(stanza) {
		var vcard = repository.get(jid);
		if (!vcard) {
		    vcard = {
			jid: jid
		    };
		    repository.add(vcard);
		} 
		jQuery.extend(vcard, $.xml2json(stanza.getElementsByTagName('vCard')[0]));		
		logger.debug(vcard);
		logger.debug(callback);
		if (typeof(callback) === 'function') { callback(vcard); }
		
	    });
	};

	/** 
	 * Function: save
	 *
	 * Save a VCard contact. 
	 *
	 * Parameters:
	 * vcard (function) - A function which provides a VCard. This function is passed a <Strophe.Builder> object
	 */
	save = function(vcard) {
	    j = Strophe.getBareJidFromJid(connection.jid);
	    var iq = $iq({
		'type': 'set',
		'xmlns': Strophe.NS.CLIENT
	    }).c('vCard', {
		'xmlns': Strophe.NS.VCARD_TEMP
	    });
	    vcard(iq);
	    connection.sendIQ(iq);	      
	};

	that = {};
	that.init = init;
	that.fetch = fetch;
	that.save = save;
	that.statusChanged = status_changed;
	return that;
    }(ContactRepository())))
}());
