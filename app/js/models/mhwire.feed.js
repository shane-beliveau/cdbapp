define([
  'backbone','underscore'
],
  function (Backbone, _) {

    return Backbone.Model.extend({

      defaults: {
        profile_image_url:'',
        from_user_name: '',
        created_at: '',
        text: ''
      },

      initialize: function () {
      },

      parse: function ( model ) {
        return { 
          profile_image_url: model.profile_image_url,
          from_user_name: model.from_user_name,
          created_at: model.created_at,
          text: this.formatTweet(model.text)
        };
      },

      formatTweet: function (tweet) {
        return tweet
          .replace(/http:\/\/([[a-z0-9_\/\.\-\+\&\!\#\~\,]+)/gi, '<a href="http://\$1" target="_blank">http://\$1</a>')
          .replace(/@([a-z0-9_]+)/gi, '<a href="http://twitter.com/\$1" target="_blank">@\$1</a>');
      }

    });

});