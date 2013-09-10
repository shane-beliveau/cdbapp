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
			lastError		: "",
			anon_meter		: 3,
			anon_meter_ts	: null,
			isRegistrant	: false,
			isSubscriber	: false,
			expireMeterDays : 30,
			today			: +new Date()
		},

		initialize: function() {
			this.initializeMeter();
		},

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
				user.timestamp = this.get('today');

				// Store user
				this.set({
					username		: user.userName,
					email			: user.email,
					name_first		: user.nameFirst,
					name_last		: user.nameLast,
					effectiveGID	: +user.effectivegid,
					isLoggedIn		: 1,
					timestamp		: user.timestamp,
					isRegistrant	: ( +user.effectivegid & 64 || +user.effectivegid & 512 ) ? true : false,
					isSubscriber	: ( +user.effectivegid & 1 ) ? true : false
				});

				// Store in localStorage as well
				this.store_user({
					username		: this.get('username'),
					email			: this.get('email'),
					name_first		: this.get('name_first'),
					name_last		: this.get('name_last'),
					effectiveGID	: this.get('effectiveGID'),
					isLoggedIn		: this.get('isLoggedIn'),
					timestamp		: user.timestamp,
					isRegistrant	: this.get('isRegistrant'),
					isSubscriber	: this.get('isSubscriber')
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
		},

		countAnonMeter: function ()
		{
			// Check to see if the user is anonymous
			if( this.get('isLoggedIn') === 0 )
			{
				this.anon_meter = ( this.anon_meter <= 0 ) ? 0 : this.anon_meter - 1;

				localStorage.setItem('CD.UserMeterInformation', 
					JSON.stringify({ 
						anon_meter : this.anon_meter,
						anon_meter_ts : this.get('anon_meter_ts')
					}) 
				);

			}

		},

		initializeMeter: function ()
		{
			var local       = JSON.parse(localStorage.getItem('CD.UserMeterInformation')) || {},
				timestamp 	= ( local.hasOwnProperty('anon_meter_ts') ) ? local.anon_meter_ts : 0,
				meter		= ( local.hasOwnProperty('anon_meter') ) ? local.anon_meter : 0,
				expires		= ( timestamp ) ? Math.ceil( ( timestamp + ( this.get('expireMeterDays') * 24 * 60 * 60 * 1000 ) ) - this.get('today') ) : null;

			console.dir({
				timestamp : timestamp,
				meter : meter,
				expires : expires,
				today: this.get('today')
			});

			// Check if the meter exists or if timestamp is past expiration date. If so, reset the meter.
			if( expires == null || expires <= 0 )
			{
				this.set({ 
					anon_meter : this.defaults.anon_meter,
					anon_meter_ts : this.get('today')
				});

				localStorage.setItem('CD.UserMeterInformation', 
					JSON.stringify({ 
						anon_meter : this.defaults.anon_meter,
						anon_meter_ts : this.get('today')
					}) 
				);
			}
			else
			{
				this.set({ 
					anon_meter : meter,
					anon_meter_ts : timestamp
				});
			}

			console.dir({
				anon_meter : 'Clicks left: ' + this.get('anon_meter'),
				anon_meter_ts : 'Timestamp: ' + this.get('anon_meter_ts')
			});
		}

	});

});