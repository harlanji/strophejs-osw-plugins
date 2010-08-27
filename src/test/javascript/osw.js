/**
 * Modeled after roster.js
 */

var oswPlugin = Strophe._connectionPlugins["osw"];
module("plugins.Osw", {
           setup: function() {

           },
           teardown: function() {

           }
});

// shortcut access



jackTest("osw.inbox() should send IQ",
         function (mockConnection) {
             jack.expect("mockConnection.sendIQ")
                 .once();
             oswPlugin.init(mockConnection);
             oswPlugin.inbox();
         });

jackTest("osw.inbox() should callback with empty array",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result"><pubsub xmlns="http://jabber.org/protocol/pubsub"><items node="http://onesocialweb.org/spec/1.0/inbox"/></pubsub></iq>'));
                     }
                 );
             oswPlugin.init(mockConnection);
             oswPlugin.callbacks.received_activity.add( function(activity) {
				called++;
             });
			oswPlugin.inbox();

            equals(called, 0, "osw.received_activity callback should not be called.");
         });



jackTest("osw.inbox() should callback with two status items",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result" from="somewhere.com"><pubsub xmlns="http://jabber.org/protocol/pubsub"><items node="http://onesocialweb.org/spec/1.0/inbox">'
							+ '<item id="test"><entry xmlns="http://www.w3.org/2005/Atom">'
							+ '<title>Hello, world!</title>'
							+ '<activity:actor xmlns:activity="http://activitystrea.ms/spec/1.0/">'
							+ 	'<name>Somebody Out There</name>'
							+ 	'<uri>somebody@somewhere.com/outthere</uri>'
							+ '</activity:actor>'
							+ '</entry></item>'
							+ '</items></pubsub></iq>'));
                     }
                 );
             oswPlugin.init(mockConnection);
             oswPlugin.callbacks.received_activity.add( function(activity) {
				called++;

				equals(activity.acl.length, 0, "1 ACL rule");
				equals(activity.objects.length, 0, "1 Object");

				equals(activity.jid, "somebody@somewhere.com/outthere", "JID");
				equals(activity.name, "Somebody Out There", "Name");

				equals(activity.title, "Hello, world!", "Title");
             });
			oswPlugin.inbox();

            equals(called, 1, "osw.received_activity callback should be called once.");
         });


jackTest("osw.inbox() should callback with a single status item",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result" from="somewhere.com"><pubsub xmlns="http://jabber.org/protocol/pubsub"><items node="http://onesocialweb.org/spec/1.0/inbox">'
							+ '<item id="test"><entry xmlns="http://www.w3.org/2005/Atom">'
							+ '<title>Hello, world!</title>'
							+ '<activity:actor xmlns:activity="http://activitystrea.ms/spec/1.0/">'
							+ 	'<name>Somebody Out There</name>'
							+ 	'<uri>somebody@somewhere.com/outthere</uri>'
							+ '</activity:actor>'
							+ '</entry></item>'
							+ '<item id="test2"><entry xmlns="http://www.w3.org/2005/Atom">'
							+ '<title>Hello, world!</title>'
							+ '<activity:actor xmlns:activity="http://activitystrea.ms/spec/1.0/">'
							+ 	'<name>Somebody Out There</name>'
							+ 	'<uri>somebody@somewhere.com/outthere</uri>'
							+ '</activity:actor>'
							+ '</entry></item>'
							+ '</items></pubsub></iq>'));
                     }
                 );
             oswPlugin.init(mockConnection);
             oswPlugin.callbacks.received_activity.add( function(activity) {
				called++;

             });
			oswPlugin.inbox();

            equals(called, 2, "osw.received_activity callback should be called twice.");
         });

jackTest("osw.inbox() should callback with a single status item with ACL.",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result" from="somewhere.com"><pubsub xmlns="http://jabber.org/protocol/pubsub"><items node="http://onesocialweb.org/spec/1.0/inbox">'
							+ '<item id="test"><entry xmlns="http://www.w3.org/2005/Atom">'
							+ '<title>Hello, world!</title>'
							+ '<activity:actor xmlns:activity="http://activitystrea.ms/spec/1.0/">'
							+ 	'<name>Somebody Out There</name>'
							+ 	'<uri>somebody@somewhere.com/outthere</uri>'
							+ '</activity:actor>'
							+ '<acl-rule xmlns="http://onesocialweb.org/spec/1.0/">'
							+	'<acl-action permission="http://onesocialweb.org/spec/1.0/acl/permission/grant">http://onesocialweb.org/spec/1.0/acl/action/view</acl-action>'
							+	'<acl-subject type="http://onesocialweb.org/spec/1.0/acl/subject/everyone"/>'
							+ '</acl-rule>'
							+ '</entry></item>'
							+ '</items></pubsub></iq>'));
                     }
                 );
             oswPlugin.init(mockConnection);
             oswPlugin.callbacks.received_activity.add( function(activity) {
				called++;

				equals(activity.acl.length, 1, "1 ACL rule");

				var rule = activity.acl[0];
				equals(rule.action, 'http://onesocialweb.org/spec/1.0/acl/action/view', "Action");
				equals(rule.permission, 'http://onesocialweb.org/spec/1.0/acl/permission/grant', "Permission");
				equals(rule.subjectType, 'http://onesocialweb.org/spec/1.0/acl/subject/everyone', "Subject Type");
				equals(rule.subject, null, "Subject");
             });
			oswPlugin.inbox();

            equals(called, 1, "osw.received_activity callback should be called once.");
         });



jackTest("osw.inbox() should callback with a single status item with a status Object.",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result" from="somewhere.com"><pubsub xmlns="http://jabber.org/protocol/pubsub"><items node="http://onesocialweb.org/spec/1.0/inbox">'
							+ '<item id="test"><entry xmlns="http://www.w3.org/2005/Atom">'
							+ '<title>Hello, world!</title>'
							+ '<activity:actor xmlns:activity="http://activitystrea.ms/spec/1.0/">'
							+ 	'<name>Somebody Out There</name>'
							+ 	'<uri>somebody@somewhere.com/outthere</uri>'
							+ '</activity:actor>'
							+ '<object xmlns="http://activitystrea.ms/spec/1.0/">'
							+ 	'<object-type>http://onesocialweb.org/spec/1.0/object/status</object-type>'
							+ 	'<content xmlns="http://www.w3.org/2005/Atom" type="text/plain">Hello, world!</content>'
							+ '</object>'
							+ '</entry></item>'
							+ '</items></pubsub></iq>'));
                     }
                 );
             oswPlugin.init(mockConnection);
             oswPlugin.callbacks.received_activity.add( function(activity) {
				called++;

				equals(activity.objects.length, 1, "1 Object");

				var object = activity.objects[0];
				equals(object.objectType, 'http://onesocialweb.org/spec/1.0/object/status', "Type");
				equals(object.status, 'Hello, world!', "Status");

             });
			oswPlugin.inbox();

            equals(called, 1, "osw.received_activity callback should be called once.");
         });



jackTest("osw.inbox() should callback with a single status item with a photo Object.",
         function (mockConnection) {
             var called = 0;
             jack.expect("mockConnection.sendIQ")
                 .once().mock(
                     function(iq, callbacksuccess, callbackerror) {
                         callbacksuccess(toDom('<iq type="result" from="somewhere.com"><pubsub xmlns="http://jabber.org/protocol/pubsub"><items node="http://onesocialweb.org/spec/1.0/inbox">'
							+ '<item id="test"><entry xmlns="http://www.w3.org/2005/Atom">'
							+ '<title>Hello, world!</title>'
							+ '<activity:actor xmlns:activity="http://activitystrea.ms/spec/1.0/">'
							+ 	'<name>Somebody Out There</name>'
							+ 	'<uri>somebody@somewhere.com/outthere</uri>'
							+ '</activity:actor>'
							+ '<object xmlns="http://activitystrea.ms/spec/1.0/">'
							+ 	'<object-type>http://onesocialweb.org/spec/1.0/object/photo</object-type>'
							+ 	'<link xmlns="http://www.w3.org/1999/xhtml" rel="alternate" href="http://example.com/image"/>'
							+ '</object>'
							+ '</entry></item>'
							+ '</items></pubsub></iq>'));
                     }
                 );
             oswPlugin.init(mockConnection);
             oswPlugin.callbacks.received_activity.add( function(activity) {
				called++;

				equals(activity.objects.length, 1, "1 Object");

				var object = activity.objects[0];
				equals(object.objectType, 'http://onesocialweb.org/spec/1.0/object/photo', "Type");
				equals(object.photo, 'http://example.com/image', "Photo");

				console.dir(object);

             });
			oswPlugin.inbox();

            equals(called, 1, "osw.received_activity callback should be called once.");
         });
