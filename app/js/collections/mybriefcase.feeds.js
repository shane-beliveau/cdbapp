define([
  'backbone','underscore', 'moment',
  'models/common.single.story',
  'utils'
],
  function (Backbone, _, Moment, SingleStoryModel, Utils) {

    return Backbone.Collection.extend({
      storageKey: 'MH.ArticlesCollection.MyBriefcase',
      model: SingleStoryModel,

      initialize: function () {
        var storedBriefcase = localStorage.getItem(this.storageKey);
        if ( storedBriefcase ) {
          this.reset(JSON.parse(storedBriefcase), { silent: true });
        }

        // this.on('add', this.store, this);
        // this.on('remove', this.store, this);
      },

      getArticle: function (feedID) {
        if( this.get(feedID).has('article') ){
          this.trigger('change:article');
          return;
        }

        this.get(feedID).fetchArticle();
      },

      store: function () {
        localStorage.setItem(this.storageKey, JSON.stringify(this.toJSON()));
      },

      add: function (model, options) {
        this.constructor.__super__.add.call(this, model, options);

        // var imgUrl = model.get('image'),
        //   encodedImage;

        // if (imgUrl) {
        //   encodedImage = Utils.getBase64Image(imgUrl);

        //   model.set({
        //     image: encodedImage || imgUrl,
        //     encoded: (encodedImage) ? true : false
        //   }, { silent: true });
        // }

        this.store();
      },

      fetch: function (options) {
        this.initialize();
        if ( options.success ) {
          options.success.call(this);
        }
      },

      remove: function (model, options) {
        this.constructor.__super__.remove.call(this, model, options);
        this.store();
      },

      contentToArray: function() {
        var items = [];

        this.each(function(model){
          items.push({
            id: model.get('id'),
            image: model.get('image'),
            title: model.get('title'),
            link: model.get('link'),
            pubDate: moment(model.get('pubDate')).format('LLLL')
          });
        });

        return items;
      }

    });

});