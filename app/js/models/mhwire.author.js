define([
  'backbone','underscore'
],
  function (Backbone, _) {

    return Backbone.Model.extend({

      defaults: {
        name:'',
        twitter: ''
      },

      initialize: function () {
      }

    });

});