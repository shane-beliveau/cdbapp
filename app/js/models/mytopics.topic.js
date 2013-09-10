define([
  'backbone','underscore',
  'collections/articles'
],
  function (Backbone, _, ArticlesCollection) {

    return Backbone.Model.extend({

      defaults: {
        id: '',
        name: '',
        feedlink: '',
        items: {},
        subscribed: false
      },

      initialize: function () {
      },

      parse: function ( model ) {
        return {
          id: model.id,
          name: model.name,
          feedlink: model.feedlink,
          items: new ArticlesCollection (model.items),
          subscribed: model.subscribed
        }
      },

    });

});