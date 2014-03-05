define([
  'backbone','underscore','mustache', 'iscrollHelper',
  'collections/mybriefcase.feeds',
  'views/article',
  'text!templates/mybriefcase/main.html',
  'text!templates/mybriefcase/feed.html',
],
  function (Backbone, _, Mustache, iscrollHelper, MyBriefcaseFeedsCollection, ArticleView, MainTemplate, FeedTemplate) {

    return Backbone.View.extend({
      el: '#content',
      name: 'My Briefcase',
      scrollers: {},

      initialize: function (options) {
        this.mainView = options.mainView;
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', this.updateLayout, this);

        this.mainView.updateBreadcrumbs([this.name]);

        this.collection = new MyBriefcaseFeedsCollection();
        this.collection.on('reset', this.renderFeeds, this);

        this.render();
        this.renderFeeds();

        this.mainView.updateLayout();
      },

      initializeScroller: function (container) {
        this.scrollers[container] = iscrollHelper.init(this.$('div.scroll-wrapper', this.$(container)),{
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

        this.mainView.off('reload');
        this.mainView.off('updateLayout');

        this.$el.off();
        this.$el.empty();
      },

      render: function () {
        var parsedTemplate = Mustache.to_html(MainTemplate);
        this.$el.html(parsedTemplate);

        this.mainView.trigger('updateLayout');
      },

      renderFeeds: function () {
        var _this = this,
          parsedTemplate = Mustache.to_html(FeedTemplate, { feeds: (this.collection.length) ? this.collection.contentToArray() : '' });

        this.$('ul#briefcasefeeds', this.$el).html(parsedTemplate);

        setTimeout(function(){
          _this.initializeScroller('#mybriefcase');
        },0);

        this.mainView.trigger('hideLoading');
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

        this.$('div.scroll-wrapper', this.$el).css({
          height: appViewportHeight
        });
      },

      events: {
        'mousedown span.remove': 'removeFeedFromBriefcase',
        'click div.briefcase-text': 'loadArticle'
      },

      removeFeedFromBriefcase: function (e) {
        e.preventDefault();
        e.stopPropagation();

        var el = this.$(e.target),
          _this = this;

        this.$(e.target).parents('.scroll-item').slideUp(150, function(){
          $(this).remove();

          _this.collection.remove(_this.collection.get(el.attr('data-id')), { silent: true });
        });
      },

      loadArticle: function (e) {
        e.preventDefault();

        var article = this.$(e.currentTarget);

        this.trigger('goToArticle', {
          collection: this.collection,
          model: this.collection.where({ id: article.attr('data-id') }),
          storageKey: 'MyBriefcase',
          page: this.$('div.briefcase-text').index(article)
        });

        // if ( this.scrollers['#mybriefcase'].isReady() ) {
        //   this.trigger('goToArticle', this.collection, this.collection.where({ id: articleID }));
        // }
      },

    });

});