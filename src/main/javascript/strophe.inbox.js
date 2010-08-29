(function() {


/*
Class: strophe.plugin.inbox

	A StropheJS plugin for OSW functionality.

*/


Strophe.addConnectionPlugin('inbox', {

	/*
	Property: callbacks

	Callbacks that can be hooked by anyone who wishes to listen. Each
	callback is a osw.util.delegate; see that for usage.

	Example:

		Add a function to the delegate:

		: osw.callbacks.received_activity.add( myCallback, this );

		Trigger the delegate to call all functions:

		: osw.callbacks.received_activity.trigger( arg1, arg2, ... );

	*/

	'callbacks' : {

		/*
		Event: received_activity

			This event is triggered whenever a new activity comes from a
			message, the inbox, or the response to activities for a specific 
			user.

		Parameters:
			activity - The activity.

		*/

		'received_activity' : new osw.util.delegate(),
	},

	/*
	Function: init

		The initialization function that is called by strophe itself.

	Scope: private

	*/

	init: function(conn) {
		this._connection = conn;

		$.each( osw.NS, function(k,v) {
			Strophe.addNamespace( k, v );
			//$.xmlns
		});

		conn.addHandler( $.proxy(this._receivedMessage_Activity, this), null, "message", "headline", null, null, null);
	},


	_receivedMessage_Activity: function(msg) {
		try {
			var me = this;

			$(msg).xmlns( osw.NS, function() {
				var entries = this.find("pubsubevt|event > pubsubevt|items > pubsubevt|item > atom|entry");
				if( entries.length > 0 ) {
					entries.each(function(i, entry) {

						var activity = me.parseActivity( entry );

						me.callbacks.received_activity.trigger( activity );
					});
				}
			});
		// ensure callback doesn't disappear upon error.
		} finally {
			return true;
		}
	},

	/*
	Function: activities

		Get activities of a specific user. Results come via the received_activity.

		This should probably have the ability to give a callback at some point.


	Parameters:

		who - The JID of a user to get status for.
	*/


	activities: function(who){
		// FIXME should !who get inbox() instead?

		this._connection.pubsub.items( this._connection.jid, 
			who, 
			osw.NS.microblog, 
			$.proxy(this._receivedActivities, this), 
			$.proxy(this._receivedActivitiesError, this)
		);
	},

	
	parseActivity: function( entryNode ) {
		var activity = $activity.parse( entryNode );


		// FIXME put this into a function somewhere.
		activity.acl = $(entryNode).find("osw|acl-rule").map(function() { 
			return osw.acl.parse(this);
		});

		return activity;
	},

	_receivedActivities: function(iq) {
		var me = this;

		$(iq).xmlns( osw.NS, function() {
			this.find("pubsub|pubsub > pubsub|items > pubsub|item > atom|entry").each(function(i, entryNode) {
				var activity = me.parseActivity( entryNode );

				me.callbacks.received_activity.trigger( activity );
			});
		});
	},

	_receivedActivitiesError: function(iq) {
		
	},

	/*
	Function: publishActivity

		Publish an activity based on an ATOM entry node, created by 
		$activity.create. See that method for detauls.

	Parameters:

		entryNode - An entry node created by $activity.create
	*/


	publishActivity: function( entryNode ) {
		var pubId = this._connection.getUniqueId("publishnode");

		var iq = $iq({type:'set', id: pubId})
				.c('pubsub', {xmlns: osw.NS.pubsub})
					.c('publish', {node: osw.NS.microblog})
						.c('item')
							.cnode( entryNode )
			.tree();

		this._connection.sendIQ( iq, function(iq) {

			//console.dirxml( iq );
		},
		function(iq) {
			alert("post error");

			//console.dirxml( iq );
		});

	},


    /**
     * Function: inbox
     * 
     * List the inbox of activities for the current user.
     **/
    inbox : function() {
		var sub = $iq({
			'from' : this._connection.jid, 
			'type' : 'get'
		}).c('pubsub', {
			'xmlns': osw.NS.pubsub 
		}).c('items', {
			'node' : 'http://onesocialweb.org/spec/1.0/inbox'
		});
		this._connection.sendIQ(sub.tree(), $.proxy(this._receivedInbox, this), function(st) {
			osw.util.logger.error('Unable to send IQ to receive activities');
			osw.util.logger.debug(st);
		});
    },

	_receivedInbox: function(iq) {
		var me = this;

		$(iq).xmlns( osw.NS, function() {
			this.find("pubsub|pubsub > pubsub|items > pubsub|item > atom|entry").each(function(i, entryNode) {
				var activity = me.parseActivity( entryNode );

				me.callbacks.received_activity.trigger( activity );
			});
		});
	},

	_receivedInboxError: function(iq) {
		
	},

	/**
	 * Get a list of all users subscribed to the PEP microblog.
	 * 
	 */
	subscriptions : function() {
		this._connection.sendIQ($iq({
			'from': this._connection.jid, 
			'type': 'get'
		}).c('pubsub', { 
			'xmlns': osw.NS.pubsub
		}).c('subscriptions', { 
			'xmlns': osw.NS.pubsub,
			'node': osw.NS.microblog
		}).tree(), callbacks.subscription);
    },


	// This is a function that Strophe calls. It is just here as a stub.
	statusChanged: function (status, condition) {

	},

    /**
     * Function: follow
     *
     * Subscribes the current user to the activity stream of the specified user.
     *
     * Parameters:
     *
     * jid - The Jabber identifier of the user to 'follow'
     * callback - A function which is called when the 'follow' request is successful
     **/
    follow : function(jid, callback) {
		osw.util.logger.info('Requesting to follow: ' + jid)

		this._connection.pubsub.subscribe( jid, jid, null, OneSocialWeb.XMLNS.MICROBLOG, null, function(stanza) {
			if($(stanza).attr('type') == 'result') {
				osw.util.logger.info("Subscribe request complete");
				osw.util.logger.debug(stanza);
				callback();
			} else {
				osw.util.logger.info("Subscribe request unsuccssful");
				osw.util.logger.debug(stanza);
			}
		});
    },

    /**
     * Function: unfollow
     *
     * Unsubscribes the current user to the activity stream of the specified user.
     *
     * Parameters:
     *
     * jid - The Jabber identifier of the user to 'follow'
     * callback - A function which is called when the 'unfollow' request is successful
     **/
    unfollow : function(jid, callback) {
		osw.util.logger.info('Requesting to unfollow: ' + jid);

		this._connection.pubsub.unsubscribe( jid, jid, OneSocialWeb.XMLNS.MICROBLOG, function(stanza) {
			if($(stanza).attr('type') == 'result') {
				osw.util.logger.info("Unsubscribe request complete");
				osw.util.logger.debug(stanza);
				callback();
			} else {
				osw.util.logger.info("Unsubscribe request unsuccssful");
				osw.util.logger.debug(stanza);
			}
		});
    },

    /**
     * Function: add_contact
     *
     * Adds a new contact to the rooster
     *
     * Parameters:
     * 
     * jid - The Jabber identifier of the user to add
     **/
    add_contact : function(jid) {
		osw.util.logger.info('Adding contact ' + jid);
		this._connection.roster.update(jid, jid, ['MyBuddies']);
		this._connection.roster.subscribe(jid);      
    },

    /**
     * Function: confirm_contact
     *
     * Confirm the addition of a contact 
     *
     * Parameters:
     *
     * jid - The Jabber identifier of the user requesting to be a contact
     **/
    confirm_contact : function(jid) {
		this._connection.roster.update(jid, jid, ['MyBuddies']);
		this._connection.roster.authorize(jid);    
    },

    /**
     * Function: vcard
     *
     * Request a VCARD of a specified user.
     *
     * Parameters:
     * 
     * jid - The Jabber Identifier of the user you wish to request the VCARD
     **/
    vcard : function(jid) {
		this._connection.sendIQ($iq({
			'type': 'get',
			'to': jid,
			'xmlns': OneSocialWeb.XMLNS.CLIENT
		}).c('vCard', {
			'xmlns': OneSocialWeb.XMLNS.VCARDTEMP
		}), function(stanza) {
				var photo;
				photo = $(stanza).find('PHOTO BINVAL');
				if (photo.length > 0) {
				photo = $(photo[0]).text();
				options.callback.avatar(jid, photo);
			}
		});
    },

    /**
     * Function: update_contact
     *
     * Updates a contact in the rooster
     *
     * Parameters: 
     * 
     * jid - The Jabber identifier of the user you wish to update
     * name - Name of the contact
     * groups - A list of group names
     **/
    update_contact : function(jid, name, groups) {
		this._connection.roster.update(jid, name, groups);
    },

    edit_profile : function(nickname) {
		this._connection.sendIQ($iq({
			'type': 'set',
			'from': this._connection.jid,
		}).c('pubsub', {
			'xmlns': OneSocialWeb.SCHEMA.PUBSUB
		}).c('publish', {
			'node' : OneSocialWeb.SCHEMA.NICKNAME
		}).c('item', {
			'id': 0
		}).c('nick', {
			'xmlns' : OneSocialWeb.SCHEMA.NICKNAME
		}).t(nickname));
    },
});

})();

