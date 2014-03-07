define([
  'backbone','underscore','mustache', 'iscrollHelper',
  'collections/mytopics.feeds',
  'views/article',
  'text!templates/mytopics/main.html',
  'text!templates/flimstrip.html',
  'text!templates/singleFeed.html',
  'text!templates/adPlaceholder.html'
],
  function (Backbone, _, Mustache, iscrollHelper, MyTopicsCollection, ArticleView, MainTemplate, FilmStripTemplate, SingleFeedTemplate, AdPlaceholder) {

    return Backbone.View.extend({
      el: '#content',
      name: 'My Topics',
      scrollers: {},

      initialize: function (options) {
        this.mainView = options.mainView;
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', this.updateLayout, this);
        this.mainView.currentSection = '#mytopics';
        this.mainView.updateNavigation();

        this.collection = new MyTopicsCollection();
        this.collection.on('ready', this.render, this);

        this.mainView.updateBreadcrumbs([this.name]);
        this.mainView.updateLayout();
      },

      initializeScroller: function (container) {
        this.scrollers[container] = iscrollHelper.init(this.$(container).find('div.scroll-wrapper'), {
          momentum: true,
          hScrollbar: false,
          vScrollbar: false
        });
      },

      reloadContent: function () {
        var mainView = this.mainView;

        this.collection.fetch({
          success: function () {
            mainView.trigger('hideLoading');
          }
        });
      },

      destroy: function () {
        _.each(this.scrollers, function (scroll) {
          scroll.destroy();
        });

        this.mainView.trigger('destroyMainScroll');
        this.mainView.off('reload');
        this.mainView.off('updateLayout');

        this.$el.off();
        this.$el.empty();

        return this;
      },

      render: function () {
        var _this = this,
          content = this.collection.where({ subscribed: true }),
          html = [],
          parsedTemplate, parsedAdPlaceholder;

        _.each(content, function(topic) {
          var feeds = Mustache.to_html(SingleFeedTemplate, { items: topic.get('items').contentToArray() }),
            filmStrip = Mustache.to_html(FilmStripTemplate, { filmstrips: [{
              filmStipID: topic.get('name').replace(/ /gi,''),
              title: topic.get('name'),
              content: feeds
            }]
          });

          html.push(filmStrip);
        });

        parsedTemplate = Mustache.to_html(MainTemplate, { content: html });
        this.$el.html(parsedTemplate);

        
        parsedAdPlaceholder = Mustache.to_html(AdPlaceholder, {
          class: 'story scroll-item',
          position: 'x88'
        });

        this.$('.news-category').each(function (index, container){
          var container = $(container);
          $('div.story:eq(1), div.story:eq(5), div.story:eq(9)', container).after(parsedAdPlaceholder);
        });
        
        this.mainView.renderAds(this.$('.ad'), { hasLabel: true });

        if ( content.length ) {
          setTimeout(function(){
            $('div.news-category', _this.$el).each(function(index, scroll){
              _this.initializeScroller('#' + $(scroll).attr('id'));
            });

            _this.mainView.trigger('createMainScroll');
            _this.mainView.trigger('hideLoading');
          }, 0);
        } else {
          this.updateLayout();

          this.initializeScroller('#mytopics');
          this.mainView.trigger('hideLoading');
        }
      },

      updateLayout: function () {
        _.each(this.scrollers, function (scroll) {
          scroll.refresh();
        });

        var appViewportHeight = this.mainView.getAppViewportHeight(100);
        this.$('li.no-content', this.$el).css({
          height: appViewportHeight,
          lineHeight: appViewportHeight
        });

        this.$('div#content-wrapper', this.$el).css({
          height: appViewportHeight
        });
      },

      events: {
        'click div.story': 'loadArticle'
      },

      loadArticle: function (e) {
        var article = this.$(e.currentTarget),
          topic = article.parents('div.news-category');
          // scrollerID = '#' + topicID;

          if (!article.hasClass('ad')) {
            e.preventDefault();
            var articleCollection = this.collection.find(function (model) {
              return (model.get('id') === topic.attr('id'));
            }, this).get('items');

            this.trigger('goToArticle', {
              collection: articleCollection,
              model: articleCollection.where({ id: article.attr('data-id') }),
              storageKey: topic.attr('id'),
              page: topic.find('div.story').index(article)
            });
          }
      }
    });

});