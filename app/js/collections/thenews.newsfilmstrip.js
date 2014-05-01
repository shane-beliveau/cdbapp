define([
  'backbone','underscore', 'moment',
  'models/common.single.story',
  'utils'
],
  function (Backbone, _, Moment, SingleStoryModel, Utils) {

    return Backbone.Collection.extend({

      storageKey: function (key) {
        return this.storageKey = 'CD.ArticlesCollection.' + key;
      },

      isFetched: false,
      fetchStatus: 'empty',

      getUrl: function (feed) {
        var timestamp = new Date();
        switch (feed) {
          case 'BreakingNews' :
            this.storageKey('BreakingNews');
            return 'http://'+ document.location.host +'/app/js/feeds/main.js?_=' + timestamp.getTime();
            break;
          case 'TOC' :
            this.storageKey('TOC');
            return 'http://'+ document.location.host +'/app/js/feeds/main.js?section=toc?_=' + timestamp.getTime();
            break;
          case 'Blogs' :
            this.storageKey('Blogs');
            return 'http://'+ document.location.host +'/app/js/feeds/main.js?section=blogs?_=' + timestamp.getTime();
            break;
          case 'TopStories' :
            this.storageKey('TopStories');
            return 'http://'+ document.location.host +'/app/js/feeds/main.js?section=topstories?_=' + timestamp.getTime();
            break;
          case 'MostPopular' :
            this.storageKey('MostPopular');
            return 'http://'+ document.location.host +'/app/js/feeds/main.js?section=mostread?_=' + timestamp.getTime();
            break;
        };
      },

      model: SingleStoryModel,

      initialize: function () {
      },

      query: function (opts) {
        var stored = localStorage.getItem(this.storageKey);

        if (stored && !window.navigator.onLine) {
          this.reset(JSON.parse(stored), { silent: true });
        }

        this.fetch(_.extend({
          update: true,
          silent: true,
          remove: true,
          timeout: 5000,
          success: function (collection, response, options) {
            collection.isFetched = true;
            collection.fetchStatus = 'success';

            collection.trigger('reset')
            collection.store();
          },
          error: function (collection, xhr, options) {
            collection.isFetched = true;
            collection.fetchStatus = 'error';

            collection.trigger('reset');
          }
        }, opts));
      },

      store: function () {
        var collection = this.clone().reset();

        this.each(function (model) {
          var clonedModel = model.clone(),
            imgUrl = clonedModel.get('image'),
            encoded = clonedModel.get('encoded'),
            encodedImage;

          // if (imgUrl && !encoded) {
          //   encodedImage = Utils.getBase64Image(imgUrl);

          //   clonedModel.set({
          //     image: encodedImage || imgUrl,
          //     encoded: (encodedImage) ? true : false,
          //   }, { silent: true });
          // }

          collection.add(clonedModel);

        });

        localStorage.setItem(this.storageKey, JSON.stringify(collection.toJSON()));
      },

      parse: function (response) {
        return (response.hasOwnProperty('rss')) ? response.rss.channel.items : response;
      },

      contentToArray: function() {
        var items = [];

        this.each(function (model) {
          items.push({
            id: model.get('id'),
            title: model.get('title'),
            kicker: model.get('kicker'),
            page: model.get('page'),
            description: model.get('description'),
            pubDate: moment(model.get('pubDate')).format('dddd, MMMM Do YYYY'),
            image: model.get('image'),
            picOrientation: model.get('picOrientation'),
            picWidth: model.get('picWidth'),
            picHeight: model.get('picHeight'),
            link: model.get('link'),
            article: (model.get('article')) ? model.get('article') : ''
          });
        });
        
        items = _.sortBy(items, function(i){ return Math.floor(i.id) * -1; });

        return items;
      }

    });

});