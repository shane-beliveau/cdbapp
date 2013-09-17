define([
  'backbone','underscore', 'moment',
  'models/common.single.story'
],
  function (Backbone, _, Moment, SingleStoryModel) {

    return Backbone.Collection.extend({

      storageKey: function (key) {
        return this.storageKey = 'CD.ArticlesCollection.' + key;
      },

      model: SingleStoryModel,

      parse: function (response) {
        return (response.hasOwnProperty('rss')) ? response.rss.channel.items : response;
      },

      initialize: function (articles, storageKey) {
        this.storageKey(storageKey);

        if ( articles && articles.length ) {
          this.reset(articles);
        } else {
          var stored = localStorage.getItem(this.storageKey);
          if (stored) {
            this.reset(this.parse(JSON.parse(stored)));
          }
        }

        this.on('saveToLocalStorage', this.save, this);
      },

      save: function () {
        localStorage.setItem(this.storageKey, JSON.stringify(this.toJSON()));
      },

      getArticle: function (model) {
        if( model.get('article') ) return;

        model.fetchArticle();
        this.each(function (articleModel) {
          if ( articleModel.get('id') !== model.get('id') ) {
            articleModel.fetchArticle();
          }
        });
      },

      contentToArray: function() {
        var items = [];

        this.each(function(model){
          items.push({
            id: model.get('id'),
            videoid: model.get('videoid'),
            title: model.get('title'),
            description: model.get('description'),
            pubDate: moment(model.get('pubDate')).format('dddd, MMMM Do YYYY'),
            image: model.get('image'),
            link: model.get('link'),
            article: (model.get('article')) ? model.get('article') : ''
          });
        });

        return items;
      }

    });

});