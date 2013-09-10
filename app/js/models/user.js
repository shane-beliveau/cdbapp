define([
  'backbone', 'underscore', 'moment'
], function(Backbone, _, Moment) {

	return Backbone.Model.extend({

		defaults: {
			extAPIPath 		: '/clickshare/extAPI1Direct.do',
			username		: null,
			email			: null,
			name_first		: null,
			name_last		: null,
			effectiveGID	: null,
			isLoggedIn		: 0,
			storageKey 		: 'CD.UserInformation',
			lastError		: ""
		},

		initialize: function() {},

		/** 
		*	Determine the extAPI url to use in authentication calls
		*	depending on the environment
		*	@return string;
		**/
		extAPI : function() 
		{
            return 'http://home.stage.crainsdetroit.com' + this.get('extAPIPath');
		},

		/** 
		*	Authenticate user callback
		*
		*	@param opts = { object }
		*		opts.CSOp = 'findAccount' by default
		*	@return object || false;
		**/
		authenticate: function(opts) 
		{
			if( !this.loginStatus() )
			{
				// Determine which method to use; authenticateUser by default
				var _opts			= opts || {};
					_opts.CSOp 		= 'findAccount';

				// Make the request to Clickshare
				var fetchOptions = _.extend({
						
						url			: this.extAPI(),
						dataType	: 'jsonp',
						data 		: _opts,

						success : function (model, response, options) 
						{
							model.authenticate_callback(response.CSResponse);
						},
						error : function(model, xhr, options) 
						{
							return -1;
						}

				}, _opts);

				this.fetch(fetchOptions);
			}
			
		},

		/** 
		*	Process and store the response from Clickshare
		*	@param response (JSON)
		* 	@return this.effectiveGID
		**/ 
		authenticate_callback: function(user)
		{

			// Reset the object to defaults
			this.clear().set(this.defaults);

			// Don't store user if the error code
			// returned from Clickshare is not zero.
			if( user.errorCode === "0" )
			{
				// Get the actual user node
				user = user.response[0].CSAccount;
				user.timestamp = +new Date();

				// Store user
				this.set({
					username		: user.userName,
					email			: user.email,
					name_first		: user.nameFirst,
					name_last		: user.nameLast,
					effectiveGID	: +user.effectivegid,
					isLoggedIn		: 1,
					timestamp		: user.timestamp
				});

				// Store in localStorage as well
				this.store_user({
					username		: this.get('username'),
					email			: this.get('email'),
					name_first		: this.get('name_first'),
					name_last		: this.get('name_last'),
					effectiveGID	: this.get('effectiveGID'),
					isLoggedIn		: this.get('isLoggedIn'),
					timestamp		: user.timestamp
				});

				// Trigger the event to let the app know that the
				// user has been stored
				this
					.trigger('userStored.main')
					.trigger('userStored.article');
			}
			else
			{
				this.lastError = user.responseString;
				this.trigger('loginFailed');
			}
		},

		/** 
		*	Store user information in localStorage for use when offline
		*	@param opts = { object }
		**/
		store_user: function(user) 
		{
			localStorage.setItem(this.get('storageKey'), JSON.stringify(user));
		},

		/** 
		*	Checks if a user is logged in
		*	@return boolean
		**/
		loginStatus: function() 
		{
			return this.get('isLoggedIn');
		},

		/** 
		*	Logs a user out from the app
		**/
		logoutUser: function(opts) 
		{
			var _this = this;

			// Make a logout call to the extAPI1Direct on Clickshare
			$.ajax({
			
				url			: this.extAPI(),
				dataType	: 'jsonp',
				data 		: { 'CSOp' : 'logout' },

				success : function (response) 
				{
					// Reset the object to defaults
					_this
						.clear()
						.set(_this.defaults);

					// Trigger any connected actions
					_this
						.trigger('userLoggedOut.main')
						.trigger('userLoggedOut.article');
				},
				error : function(xhr, ajaxOptions, thrownError) 
				{

					var AccessCookie = _this.readCookie('CSAuthCookie');

					// Check to see if the cookie got erased
					// even though an error was thrown ( from 302 redirect )
					if( AccessCookie === '""' ||  AccessCookie === null)
					{
						
						// Reset the object to defaults
						_this
							.clear()
							.set(_this.defaults);

						// Trigger any connected actions
						_this
							.trigger('userLoggedOut.main')
							.trigger('userLoggedOut.article');	
					}
				}

			});
				
		},

		readCookie: function (name) 
		{
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1, c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
			}
			return null;
		}

	});

});