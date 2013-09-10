define([
  'backbone','underscore'
],
  function (Backbone, _) {

    return Backbone.Model.extend({

      defaults: {
        id: '',
        image: '',
        title: '',
        link: '',
        pubDate: ''
      },

      initialize: function () {
      },

    });

});