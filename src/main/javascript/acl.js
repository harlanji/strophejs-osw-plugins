(function() {

/*

Class: osw.acl

	ACL creation and parsing.

*/
osw.acl = {

    /*
	Function: rule
      
		Create an ACL rule and return the DOM element. 

		Note that the first
		three parameters may be shorthand for the wanted constant, for example
		'grant' is equivalent to osw.acl.permission.grant when passed as the 
		first argument.

	Parameters:
		perm - A permission type from osw.acl.permission.
		action - An action from osw.acl.action
		subjectType - A subjectType from osw.acl.subjectType
		subject - A string description of the subject. Useful for group/user type.

	Returns: 
		A DOM element that can be used anywhere an ACL is needed.
    */

	'rule' : function(perm, action, subjectType, subject) {
		// allow shorthand use of constants.
		if(osw.acl.permission.hasOwnProperty(perm)) { perm = osw.acl.permission[perm]; }
		if(osw.acl.action.hasOwnProperty(action)) { action = osw.acl.action[action]; }
		if(osw.acl.subjectType.hasOwnProperty(subjectType)) { subjectType = osw.acl.subjectType[subjectType]; }

		return $build('acl-rule', {'xmlns': osw.NS.osw})
			.c('acl-action', {'xmlns': osw.NS.osw, 'permission': perm}).t( action ).up()
			.c('acl-subject', {'xmlns': osw.NS.osw, 'type': subjectType}).t( subject || '' ).up()
			.tree();
	},

    /*
	Function: parse
      
		Parse an osw ACL rule and return a JSON representation of it.

	Parameters:
		node - The DOM node that contains the rule.

	Returns: 
		A JSON representation of the rule.
    */

	'parse' : function(node) {
		var rule;

		$(node).xmlns( osw.NS, function() {
			rule = {
				'action': this.find("osw|acl-action").text() || null, 
				'permission': this.find("osw|acl-action").attr("permission"),
				'subjectType': this.find("osw|acl-subject").attr("type"),
				'subject': this.find("osw|acl-subject").text() || null,
			}
		}); 

		return rule;
	},

    /*
	Constants: permission
      
		Constants for grant/deny operations.

		permission.grant - Grant
		permission.deny - Deny

	*/
	'permission' : {
		'grant' : 'http://onesocialweb.org/spec/1.0/acl/permission/grant',
		'deny' : 'http://onesocialweb.org/spec/1.0/acl/permission/deny'
	},

    /*
	Constants: action
      
		Constants for actions, essentially CRUD

		action.view - View
		action.update - Update

	*/
	'action' : {
		'view' : 'http://onesocialweb.org/spec/1.0/acl/action/view',
		'update' : 'http://onesocialweb.org/spec/1.0/acl/action/update'
	},

    /*
	Constants: subjectType
      
		Constants for subject types

		subjectType.everyone - Everyone. Rule does not require a subject.
		subjectType.user - User. Rule subject is a jid.
		subjectType.group - Group. Rule subject is a roster group.

	*/
	'subjectType' : {
		'everyone' : 'http://onesocialweb.org/spec/1.0/acl/subject/everyone',
		'user' : 'http://onesocialweb.org/spec/1.0/acl/subject/user',
		'group' : 'http://onesocialweb.org/spec/1.0/acl/subject/group'
	
	},
};

})();
