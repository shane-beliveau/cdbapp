define([
  'backbone','underscore','mustache', 'iscrollHelper',
  'collections/mhwire.authors',
  'collections/mhwire.feeds',
  'text!templates/mhwire/main.html',
  'text!templates/mhwire/author.html',
  'text!templates/mhwire/feed.html',
],
  function (Backbone, _, Mustache, iscrollHelper, MhWireAuthorsCollection, MhWireFeedsCollection, MainTemplate, AuthorTemplate, FeedTemplate) {

    return Backbone.View.extend({
      el: '#content',
      name: 'MH Wire',
      scrollers: {},

      initialize: function (options) {
        this.render();

        this.mainView = options.mainView;
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', this.updateLayout, this);

        this.mainView.updateLayout();

        this.authors = new MhWireAuthorsCollection();
        this.authors.on('reset', this.renderAuthors, this);

        this.feeds = new MhWireFeedsCollection();
        this.feeds.on('reset', this.renderFeeds, this);

        this.updateLayout();
      },

      initializeScroller: function (container) {
        this.scrollers[container] = iscrollHelper.init(this.$(container).find('div.scroll-wrapper'),{
          momentum: true,
          hScrollbar: false,
          vScrollbar: false
        });
      },

      reloadContent: function () {
        var _this = this;

        this.feeds.fetch({
          success: function () {
            _this.mainView.trigger('hideLoading');
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
      },

      renderAuthors: function () {
        var _this = this,
          parsedTemplate = Mustache.to_html(AuthorTemplate, { authors: this.authors.contentToArray() });

        this.$('ul#authors', this.$el).html(parsedTemplate);
        this.initializeScroller('#authorScroll');
        
        setTimeout(function(){
          _this.$('ul#authors a.load-feed-from-author:first', _this.$el).trigger('click');
          _this.mainView.trigger('hideLoading');
        },0);
      },

      renderFeeds: function () {
        var _this = this,
          parsedTemplate = Mustache.to_html(FeedTemplate, { feeds: this.feeds.contentToArray() });

        this.$('ul#mhwirefeeds', this.$el).html(parsedTemplate);

        setTimeout(function(){
          _this.initializeScroller('#tweetsScroll');
          _this.updateLayout();
        }, 0);
      },

      updateLayout: function () {
        var appViewportHeight = this.mainView.getAppViewportHeight(100);
        $('div#content-wrapper').css({
          height: appViewportHeight
        });

        this.$('div.scroll-wrapper', this.$el).css({
          height: appViewportHeight
        });

        this.$('li.no-content', this.$el).css({
          height: appViewportHeight,
          lineHeight: appViewportHeight
        });

        $('#tweetsScroll .scroller').css({
          height: $('ul#mhwirefeeds').outerHeight() + 'px'
        });

        _.each(this.scrollers, function (scroll) {
          scroll.refresh();
        });

      },

      events: {
        'click a.load-feed-from-author': 'loadFeedFromAuthor'
      },

      loadFeedFromAuthor: function (e) {
        e.preventDefault();

        if ( this.scrollers['#authorScroll'].isReady() ) {
          var twitterID = this.$(e.target).attr('href');
          this.feeds.setTwitterID(twitterID);

          this.$('a.load-feed-from-author', this.$el).removeClass('active');
          this.$(e.target).addClass('active');

          this.mainView.updateBreadcrumbs([this.name, this.$(e.target).text()]);

          if ( this.scrollers.hasOwnProperty('#tweetsScroll') ) {
            this.scrollers['#tweetsScroll'].destroy();
          }
        }
      }

    });

});