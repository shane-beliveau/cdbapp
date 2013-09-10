define([
  'backbone',
  'mustache',
  'models/ad.model',
  'text!templates/offline/ad.html'
], function (Backbone, Mustache, AdModel, AdTemplate) {

  return Backbone.View.extend({
    el: '#fullPageAd',
    name: 'Ad',

    model: AdModel,

    initialize: function (opts) {
      this.model = new AdModel({
        pos: opts.position,
        is_open: opts.is_open
      });
    },

    render: function () {
      var adTemplateParsed = Mustache.to_html(AdTemplate, { 
        ad: this.model.attributes,
        close: true
      });
      this.$el.html(adTemplateParsed).show();
    },

    destroy: function () {
      this.$el.empty().hide();
      this.options.is_open = false;
    },

    events: {
      'click a.close': 'destroy'
    }

  });

});