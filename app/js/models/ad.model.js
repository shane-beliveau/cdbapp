define([
	'backbone', 'underscore'],

function(Backbone, _) {

	return Backbone.Model.extend({
		defaults: {
			adHTML: '',
			OAS_url: 'http://oascnx09006.247realmedia.com/RealMedia/ads/',
			OAS_sitepage: 'www.detroitbusiness.com/app'.toLowerCase(),
			OAS_listpos: 'x85,x86,x87,x88,x89,x90,x91,x94,x95,x96',
			OAS_query: '',
			OAS_target: '_blank',
			OAS_rns: Math.floor((Math.random() * 999999999) + 100000000),
			pos: '',
			is_open: false,
			isOffline: false,
			ad_key: 'CD.Advertisements.',
			showStored: true,
			stored: '',
			countImpression: false
		},

		url: function() {
			return '';
		},

		initialize: function() {

			if( this.get('pos') !== '' )
			{
				if( $('body').hasClass('isOffline') )
				{
					this.set('isOffline', true);
					this.set('countImpression', true);
				}
				
				this.showStored();
			}
			

		},

		fetchAds: function() {

			var pos_array = this.get('OAS_listpos').split(','),
				OAS_url = this.get('OAS_url'),
				OAS_sitepage = this.get('OAS_sitepage'),
				OAS_query = this.get('OAS_query'),
				ad_key = this.get('ad_key');

			for (pos in pos_array) {
				
				var rns = Math.floor((Math.random() * 999999999) + 100000000);

				$.ajax({
					url: OAS_url + 'adstream_dx.ads/json/' + OAS_sitepage + '/' + rns + '/@' + pos_array[pos] + '?' + OAS_query,
					type: 'get',
					dataType: 'json',
					success: function(data) {
						// OAS returns { "Ad" : [ { key: value, ... } ] }
						var Ads = data.Ad;

						// Loop through all of the ad objects in the returned array
						for (j in Ads) {
							
							// Add the other parameters to the object
							Ads[j].Impressions = 0;

							// Set the item to localStorage. try/catch in case user's storage is full.
							try {
								localStorage.setItem(ad_key + Ads[j].Pos, JSON.stringify(Ads[j]));
							} catch (e) {
								console.log('Error saving ' + ad_key + Ads[j].Pos + ' to localStorage.')
							}

							// Create a canvas of the image and store the image to localStorage
							// Might still "tainted-canvas" issues due to cross-domain request of creative
							var img = new Image,
								canvas = document.createElement("canvas"),
								ctx = canvas.getContext("2d"),
								src = Ads[j].FileUrl;

							// Fire the script to store the image once the image has been created. 
							img.onload = function() {
								canvas.width = img.width;
								canvas.height = img.height;
								ctx.drawImage(img, 0, 0);

								// Save as JSON in localStorage. try/catch in case user's storage is full.
								try {
									localStorage.setItem(ad_key + Ads[j].Pos + '.Creative', canvas.toDataURL(Ads[j].AdType));
								} catch (e) {
									console.log('Storage failed: ' + e);
								}

							}

							// Set the crossOrigin to anonymous to avoid security issues
							// in browsers that support this option.
							img.crossOrigin = 'http://profile.ak.fbcdn.net/crossdomain.xml';

							// Load the image source
							img.src = src;

						}
					}
				});

			}
		},

		recordImpressions: function() {

			var pos_array 	= this.get('OAS_listpos').split(','),
				ad_key 		= this.get('ad_key');

			for (pos in pos_array) {
				// Get the item from localStorage
				var ad = localStorage.getItem(ad_key + pos_array[pos]) || 0,
					imps,
					imp_url;

				if (ad) {
					// Parse JSON
					ad = $.parseJSON(ad);

					// Get number of impressions + impression URL
					imps = ad.Impressions;
					imp_url = ad.ImpUrl;

					// Send impressions to OAS if applicable
					if (imps) {
						for (x = 1; x <= imps; x++) {
							$.post(imp_url);
						}
					}
				}

			}

		},

		showStored : function() {

			// Get the item from localStorage
			var	ad_key 	 	= this.get('ad_key'),
				cntImp  	= this.get('countImpression'),
				position	= this.get('pos'),
				ad 		 	= localStorage.getItem( ad_key + position ) || 0,
				creative 	= localStorage.getItem( ad_key + position + '.Creative') || 0;

				// Make sure that the localStorage items exist as well as
				// the ad position that we're going to call
				if( ad && creative )
				{
					if( cntImp )
					{
						// Parse JSON
						ad = $.parseJSON(ad);

						// Count an impression for that item
						ad.Impressions++;

						localStorage.setItem( ad_key + position, JSON.stringify(ad) );
					}
					
					this.set('stored', creative);
				}

		}

	});
});