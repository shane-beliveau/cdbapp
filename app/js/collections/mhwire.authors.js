define([
  'backbone','underscore',
  'models/mhwire.author'
],
  function (Backbone, _, MhWireAuthorModel) {

    return Backbone.Collection.extend({

      url: 'services/MhWire.Authors.json',
      model: MhWireAuthorModel,

      parse: function ( response ) {
        return response.authors;
      },

      initialize: function () {
        this.fetch();
      },

      contentToArray: function() {
        var items = [];

        this.each(function(model){
          items.push({
            name: model.get('name'),
            twitter: model.get('twitter')
          });
        });

        return items;
      }

    });

});