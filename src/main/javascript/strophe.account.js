/**
 * Function: Strophe.account
 * 
 * Methods for handling the creation of new accounts
 */
(function() {
    Strophe.addConnectionPlugin('account', (function() {

	var that, init, register, connection, status_changed, set_connection_callbacks, callbacks, logger;

	// A logger which uses the Firebug 'console'
	logger =  {
	    debug: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.debug('strophe.account: ' + msg);
		}
	    },
	    info: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.info('strophe.account: ' + msg);
		}
	    },
	    error: function(msg) {
		if (typeof(console) !== 'undefined') {
		    console.error('strophe.account: ' + msg);
		}
	    }
	};

	/**
	 * Group: callbacks
	 */
	callbacks = {};
	/**
	 * Callback: connection_failed
	 *
	 * Invoked when the connection to the server fails
	 */
	callbacks.connection_failed = function() {};
	/**
	 * Callback: connection
	 * 
	 * Invoked whenever the connection status changes
	 */
	callbacks.connection = function() {};
	/**
	 * Callback: connected
	 *
	 * Invoked when the connection is successful
	 */
	callbacks.connected = function() {};

	/**
	 * Group: Functions
	 */

	/**
	 * Function: init
	 *
	 * Constructor used by the Strophe plugin framework.
	 */
	init = function(conn) {
	    connection = conn;	    
	};

	/**
	 * Function: set_connection_callbacks
	 * 
	 * Overrides the default connection callbacks if they are specified.
	 */
	set_connection_callbacks = function(callbks) {
	    if (typeof(callbks) !== 'undefined') {
		if (typeof(callbks.connection) !== 'undefined') {
		    logger.info("Overriding connection callback");
		    callbacks.connection = callbks.connection;
		}
		if (typeof(callbks.connection_failed) !== 'undefined') {
		    logger.info("Overriding connection_failed callback");
		    callbacks.connection_failed = callbks.connection_failed;
		}
		if (typeof(callbks.connected) !== 'undefined') {
		    logger.info("Overriding connected callback");
		    callbacks.connected = callbks.connected;
		}
	    }
	};

	/**
	 * Function: status_changed
	 *
	 * Callback which is invoked during the connection to the server whenever
	 * authenticating or registering.
	 */
	status_changed = function(status) {
	    var st;	    
	    if (status === Strophe.Status.CONNECTED) {
		logger.info("Invoking connected callback");
		callbacks.connected();
	    } else if (status === Strophe.Status.CONNFAIL) {
		logger.info("Invoking connection_failed callback");
		callbacks.connection_failed();
	    } else {
		for (st in Strophe.Status) {
		    if (Strophe.Status[st] === status) {
			logger.info("Invoking connection callback");
			callbacks.connection(st);
		    }
		}
	    }
	}

	/** 
	 * Function: authenticate
	 * 
	 * Authenticates with a OneSocialWeb server using the specified credentials.
	 * 
	 * Parameters:
	 * 
	 * username - XMPP username
	 * domain - Domain of the XMPP server
	 * password - Plain text password of the XMPP username
	 **/
	authenticate = function(username, domain, password) {
	    logger.info('Connecting with username ' + username);
	    connection.connect(username, domain, password);
	};

	/**
	 * Function: register
	 * 
	 * Register a new account with the server.
	 *
	 * Parameters:
	 * username - The desired username
	 * domain - The domain of the server
	 * email - The email address of the desired user
	 * callbacks - Callbacks for connection events, success and failure
	 * callbacks.success - Function to invoke when registration has been successful
	 * callbacks.error - Function to invoke when registration fails
 
	 */
	register = function(username,
			    domain, 
			    password, 
			    email_address, 
			    callbks) {
	    
	    var iq;

	    set_connection_callbacks(callbks);
	    
	    // Tell Strophe to initiate a connection. This only appears to have the purpose
	    // of setting the domain. There must be a better way of doing this.
	    connection.connect('', domain, '', connection_callback);
	    
	    logger.info('Attempting to register with: ' + username + ', ' + password + ', ' + email_address);
	    iq = $iq({'type':'set'})
		.c('query', {'xmlns': OneSocialWeb.XMLNS.REGISTER})
		.c('username').t(username).up()
		.c('password').t(password).up()
		.c('email').t(email_address);
	    
	    connection.sendIQ(iq.tree(), function(stanza) {
		callbacks.success();
	    }, function(stanza) {
		var error, message, code;
		error = $(stanza).find("error");
		message = error.children()[0].tagName;
		code = error.attr('code');
		if (typeof(callbacks.error) !== 'undefined') {
		    callbacks.error(code, message);
		}
	    }); 
	};
	that = {};
	that.init = init;
	that.register = register;
	that.authenticate = authenticate;
	that.set_connection_callbacks = set_connection_callbacks;
	that.statusChanged = status_changed;
	return that;
    }()))
}());
