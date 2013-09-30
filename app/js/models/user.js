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
			isAnonymous		: true,
			expireMeterDays : 30,
			today			: +new Date(),
			isOffline		: false,
			meter_product   : 'crainsdetroit-metered',
			reg_meter		: 0,
			reg_meter_ts	: null,
			reg_default     : 12
		},

		initialize: function() {
			
			var _this = this;

			if( !window.navigator.onLine )
			{
				this.set('isOffline', true);
			}

			// Call Clickshare before unloading the window to 
			// update the user's meter if applicable.
			$(window).off('beforeunload');
			$(window).on('beforeunload', function() {
				_this.updateRegMeterAtClickshare();
			});

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
			if( this.get('isOffline') )
			{
				// Check if user login has been stored in localStorage
				var userStored = this.loginStored();

				// Apply the user's credentials to the app if they exist
				if (userStored !== null) 
				{
					var user = JSON.parse(userStored);

					// Store user
					this.set({
						username		: user.username,
						email			: user.email,
						name_first		: user.name_first,
						name_last		: user.name_first,
						effectiveGID	: +user.effectiveGID,
						isLoggedIn		: user.isLoggedIn,
						timestamp		: user.timestamp,
						isRegistrant	: ( +user.effectiveGID & 64 || +user.effectiveGID & 512 ) ? true : false,
						isSubscriber	: ( +user.effectiveGID & 1 ) ? true : false,
						isAnonymous		: false
					});

					// Trigger the event to let the app know that the
					// user has been stored
					this
						.trigger('userStored.main')
						.trigger('userStored.article');
				}
				else 
				{
					// Reset the object to defaults
					this.clear().set(this.defaults);
				}
			}
			else
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
					isSubscriber	: ( +user.effectivegid & 1 ) ? true : false,
					isAnonymous		: false,
					reg_meter		: ( user[ this.defaults.meter_product ] ) ? user[ this.defaults.meter_product ].split('|')[0] : this.defaults.reg_default,
					reg_meter_ts	: ( user[ this.defaults.meter_product ] ) ? user[ this.defaults.meter_product ].split('|')[1] : new Date().toISOString().replace(/([A-Z]+)/gi,' ').trim()
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
					isSubscriber	: this.get('isSubscriber'),
					isAnonymous		: this.get('isAnonymous')
				});

				// Store reg meter info in it's own key
				localStorage.setItem('CD.RegMeterInformation', 
					JSON.stringify({ 
						reg_meter 		: this.get('reg_meter'),
						reg_meter_ts 	: this.get('reg_meter_ts')
					}) 
				);

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
		*	Checks if a user has login stored locally
		*	@return boolean
		**/
		loginStored: function() 
		{
			return localStorage.getItem( this.get('storageKey') );
		},

		/** 
		*	Logs a user out from the app
		**/
		logoutUser: function(opts) 
		{
			var _this = this;

			// Update Clickshare meter before clearing settings
			this.updateRegMeterAtClickshare();

			// Reset the object to defaults and remove localStorage item
			_this.clear().set(_this.defaults);
			localStorage.removeItem( this.get('storageKey') );

			// Make a logout call to the extAPI1Direct on Clickshare
			$.ajax({
			
				url			: this.extAPI(),
				dataType	: 'jsonp',
				data 		: { 'CSOp' : 'logout' },

				success : function (response) 
				{
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
						// Trigger any connected actions
						_this
							.trigger('userLoggedOut.main')
							.trigger('userLoggedOut.article');	
					}
				}

			});
				
		},

		countMeter: function ()
		{
			// Don't bother counting the meter if the user is a subscriber
			if( this.get('isSubscriber') )
			{
				return this;
			}

			// Set up the anonymous meter
			this.initializeAnonMeter();

			var anon_meter 	= this.get('anon_meter'),
				reg_meter 	= this.get('reg_meter');

			// Check if the user is a registrant and make sure to expire their anonymous meter
			// before dipping into their registrant meter count.
			if( this.get('isRegistrant') && !anon_meter )
			{
				// Count against the meter minus one.
				reg_meter = ( reg_meter <= 0 ) ? 0 : reg_meter - 1;

				// Set the meter up in the model
				this.set({ 
					reg_meter : reg_meter,
					reg_meter_ts : this.get('reg_meter_ts')
				});
			
				// If the meter is expired, let Clickshare know.
				if( reg_meter === 0 )
				{
					this.updateRegMeterAtClickshare();
				}
			}

			// Check to see if the user is anonymous
			else
			{
				anon_meter = ( anon_meter <= 0 ) ? 0 : anon_meter - 1;

				this.set({ 
					anon_meter : anon_meter,
					anon_meter_ts : this.get('anon_meter_ts')
				});
				
				localStorage.setItem('CD.UserMeterInformation', 
					JSON.stringify({ 
						anon_meter : anon_meter,
						anon_meter_ts : this.get('anon_meter_ts')
					}) 
				);				
			}

			

		},

		initializeAnonMeter: function ()
		{
			var local       = JSON.parse(localStorage.getItem('CD.UserMeterInformation')) || {},
				timestamp 	= ( local.hasOwnProperty('anon_meter_ts') ) ? local.anon_meter_ts : 0,
				meter		= ( local.hasOwnProperty('anon_meter') ) ? local.anon_meter : 0,
				expires		= ( timestamp ) ? Math.ceil( ( timestamp + ( this.get('expireMeterDays') * 24 * 60 * 60 * 1000 ) ) - this.get('today') ) : null;

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
		},

		updateRegMeterAtClickshare: function()
		{
			// Call Clickshare to update the user's meter count
			// if they were logged in as a metered member.
			var meter 		= this.get('reg_meter'),
				time  		= this.get('reg_meter_ts'),
				string 		= meter + '|' + time,
				datum   	= 'selection.' + this.defaults.meter_product,
				ajaxData 	= {};

			// Build data params
			ajaxData[datum] = string;
			ajaxData['CSOp'] = 'updateAccount';

			// Make the call
			$.ajax({
				url: this.extAPI(),
				type: 'post',
				dataType: 'jsonp',
				data: ajaxData,

				// << Debug >>
				success: function(data) {
					console.group('Meter Information');
					console.dir(data);
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