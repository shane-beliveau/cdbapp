define([
  'backbone','underscore', 'moment',
  'models/mhwire.feed'
],
  function (Backbone, _, Moment, MhWireFeedModel) {

    return Backbone.Collection.extend({

      url: function(){
        var timestamp = new Date();
        return 'http://'+ document.location.host +'/section/App-Twitter-OAuth?url=search%2Ftweets.json%3Fq%3Dfrom%253A' + this.twitterID + '&_=' + timestamp.getTime();
      },

      model: MhWireFeedModel,

      initialize: function () {
      },

      setTwitterID: function (twitterID) {
        this.twitterID = twitterID;
        this.fetch();
      },

      fetch: function (options) {
        var config = _.extend({
          type: 'GET',
          dataType: 'json',
          url: this.url(),
          processData: true
        }, options);

        this.constructor.__super__.fetch.call(this,config);
      },

      parse: function ( response ) {
        return response.statuses;
      },

      contentToArray: function() {
        var items = [];

        this.each(function(model){
          items.push({
            profile_image_url: model.get('profile_image_url'),
            from_user_name: model.get('from_user_name'),
            created_at: moment(model.get('created_at')).fromNow(),
            text: model.get('text')
          });
        });

        return items;
      }

    });

});