(function() {
/*
	Class: osw.util

		A collection of utilities.

*/
osw.util = {
	/*
	Function: uniqueRandom

		Returns a random number that is checked using user-supplied checkFn.

	Parameters:
		checkFn - a function that returns true if the number is used, false if it is unique.
		max - The maximum value. Default is INT32_MAX.
		min - The minimum value. Default is 0.

	*/
	'uniqueRandom': function(checkFn, max, min) {
		var n;

		max = max || 0x7fffffff;
		min = min || 0;

		do {
			n = Math.floor( Math.random() * max ) + min;
		} while( checkFn(n) );
	},
};




/*
Class: osw.util.logger

	Returns a random number that is checked using user-supplied checkFn.

*/

osw.util.logger = {

	/*
	Function: debug

	Parmateters:
		msg - The message.

	*/
	debug: function(msg) {
		if (typeof(console) !== 'undefined') {
		console.debug(msg);
		}
	},

	/*
	Function: info

	Parmateters:
		msg - The message.

	*/
	info: function(msg) {
		if (typeof(console) !== 'undefined') {
		console.info(msg);
		}
	},

	/*
	Function: error

	Parmateters:
		msg - The message.

	*/
	error: function(msg) {
		if (typeof(console) !== 'undefined') {
		console.error(msg);
		}
	}
};

/*
Class: osw.util.delegate

	A function that can be used for callbacks to privide an easy way of 
	assigning and managing handles.

*/

osw.util.delegate = function() {};

osw.util.delegate.prototype = {
	_fn : {},

	/*
	Function: add

		Add a function to the list of functions that will be invoked upon a
		call to .trigger(). It will be called with the parameters given to trigger
		and in the context supplied.

	Parameters:

		fn - The function that will be invoked.
		context - The context that fn will be called in.

	Returns:

		Returns the handle that can be used in .remove().
	*/

	'add' : function(fn, context) {
		var handle;

		handle = osw.util.uniqueRandom( this._fn.hasOwnProperty );

		if( context ) {
			var wrapped = fn;
			fn = function() {
				wrapped.apply( context, arguments );
			}
		}

		this._fn[ handle ] = fn;

	},

	/*
	Function: remove

		Remove a function from the delegate.

	Parameters:

		handle - The handle that was returned by the .add() call.
	*/

	'remove' : function(handle) {
		delete this._fn[ handle ];
	},

	/*
	Function: trigger

		Invoke all functions using the supplied arguments.

	Parameters:

		... - Arguments
	*/

	'trigger' : function() {
		for( var handle in this._fn ) {
			this._fn[ handle ].apply( document, arguments );
		}
	}

};

})();
