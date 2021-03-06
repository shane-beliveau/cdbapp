define([
  'backbone','underscore',
  'models/mytopics.topic',
  'collections/thenews.newsfilmstrip'
],
  function (Backbone, _, MyTopicsModel, NewsFilmstripCollection) {

    return Backbone.Collection.extend({
      storageKey: 'CD.MyTopics',
      mainStorageKey: 'CD.ArticlesCollection.',

      url: 'http://'+ document.location.host +'/app/js/feeds/main.js?section=mytopics?_=' + new Date().getTime(),
      model: MyTopicsModel,

      parse: function (response) {
        return (response.hasOwnProperty('rss')) ? response.rss.channel.topics : response;
      },

      initialize: function () {
        var stored = localStorage.getItem(this.storageKey);

        this.on('change:subscribed', this.saveCollection , this);

        if (stored) {
          this.reset(this.parse(JSON.parse(stored)), { parse:true, silent: true });

          this.each(function (model) {
            if (model.get('subscribed')) {
              var storedArticles = localStorage.getItem(this.mainStorageKey + model.get('id'));
              model.set({ items: new NewsFilmstripCollection(JSON.parse(storedArticles)) });
            }
          }, this);

        }

        this.fetch({
          update: true,
          silent: true,
          timeout: 10000,
          success: function ( collection, response, options ) {
            collection.trigger('ready');
          },
          error: function ( collection, xhr, options ) {
            //collection.trigger('ready');
            console.log(collection);
          }
        });
      },

      saveCollection: function (model, value, options) {
        var collection;
        if ( model.get('subscribed') ) {
          collection = new NewsFilmstripCollection(model.get('items'), model.get('id'));
          collection.storageKey(model.get('id'));
          collection.url = model.get('feedlink') + '?_=' + new Date().getTime();
          collection.query();
        } else {
          localStorage.removeItem(this.mainStorageKey + model.get('id'));
        }

        localStorage.setItem(this.storageKey, JSON.stringify(this.toJSON()));
      },

      subscribeTopic: function (topicID) {
        var topic = this.where({ id: topicID })[0];
        topic.set({ subscribed: ( topic.get('subscribed') ) ? false : true });
      },

      contentToArray: function() {
        var items = [];

        this.each(function(model){
          items.push({
            id: model.get('id'),
            name: model.get('name'),
            subscribed: model.get('subscribed'),
            items: (model.get('items').length) ? model.get('items').contentToArray() : ''
          });
        });

        return items;
      }

    });

});