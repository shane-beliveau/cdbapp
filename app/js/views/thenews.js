define([
    'backbone', 'underscore', 'mustache', 'iscrollHelper',
    'collections/thenews.newsfilmstrip',
    'collections/articles',
    'models/ad.model',
    'views/article',
    'text!templates/thenews/main.html',
    'text!templates/flimstrip.html',
    'text!templates/singleHero.html',
    'text!templates/dots.html',
    'text!templates/singleFeed.html',
    'text!templates/adPlaceholder.html',
    'utils'
  ],
  function(Backbone, _, Mustache, iscrollHelper, TheNewsCollection, ArticlesCollection, AdModel, ArticleView, MainTemplate, FilmStripTemplate, SingleHeroTemplate, DotsTemplate, SingleFeedTemplate, AdPlaceholder, Utils) {

    return Backbone.View.extend({
      el: '#content',
      name: 'Most Popular',
      isOfflineMode: false,
      scrollers: {},

      initialize: function(options) {
        this.mainView = options.mainView;
        this.mainView.currentSection = '#thenews'
        this.mainView.updateLayout();
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', this.refreshScrollers, this);

        this.mainView.updateBreadcrumbs([this.name]);

        this.BreakingNewsCollection = new TheNewsCollection();
        this.BreakingNewsCollection.on('reset', function() {
          this.render();
          this.saveAllArticlesToLocalStorage(this.BreakingNewsCollection, 'BreakingNews');
        }, this);
        this.BreakingNewsCollection.url = this.BreakingNewsCollection.getUrl('BreakingNews');
        this.BreakingNewsCollection.query();

        this.TOCCollection = new TheNewsCollection();
        this.TOCCollection.on('reset', function() {
          this.render();
          this.saveAllArticlesToLocalStorage(this.TOCCollection, 'TOC');
        }, this);
        this.TOCCollection.url = this.TOCCollection.getUrl('TOC');
        this.TOCCollection.query();

        this.BlogsCollection = new TheNewsCollection();
        this.BlogsCollection.on('reset', function() {
          this.render();
          this.saveAllArticlesToLocalStorage(this.BlogsCollection, 'Blogs');
        }, this);
        this.BlogsCollection.url = this.BlogsCollection.getUrl('Blogs');
        this.BlogsCollection.query();

        this.MostPopularCollection = new TheNewsCollection();
        this.MostPopularCollection.on('reset', function() {
          this.render();
          this.saveAllArticlesToLocalStorage(this.MostPopularCollection, 'MostPopular');
        }, this);
        this.MostPopularCollection.url = this.MostPopularCollection.getUrl('MostPopular');
        this.MostPopularCollection.query();

        this.TopStoriesCollection = new TheNewsCollection();
        this.TopStoriesCollection.on('reset', function() {
          this.render();
          this.saveAllArticlesToLocalStorage(this.TopStoriesCollection, 'TopStories');
        }, this);
        this.TopStoriesCollection.url = this.TopStoriesCollection.getUrl('TopStories');
        this.TopStoriesCollection.query();

      },

      initializeScroller: function(container, opts) {
        var config = _.extend({
          momentum: true,
          hScrollbar: false,
          vScrollbar: false,
          minDistance: 100
        }, opts);

        this.scrollers[container] = iscrollHelper.init(this.$(container).find('div.scroll-wrapper'), config);
      },

      refreshScrollers: function() {
        this.updateLayout();

        _.each(this.scrollers, function(scroll) {
          scroll.refresh();
          scroll.scrollToPage(scroll.currPageX, 0, 100);
        });
      },

      reloadContent: function() {
        var mainView = this.mainView;

        this.BreakingNewsCollection.fetch({
          success: function() {
            mainView.trigger('hideLoading');
          }
        });
      },

      destroy: function() {
        _.each(this.scrollers, function(scroll) {
          scroll.destroy();
        });

        this.mainView.trigger('destroyMainScroll');
        this.mainView.off('reload');
        this.mainView.off('updateLayout');

        this.$el.off();
        this.$el.empty();

        return this;
      },

      render: function() {
        if (!(this.MostPopularCollection.isFetched &&
          this.BreakingNewsCollection.isFetched &&
          this.BlogsCollection.isFetched &&
          this.TOCCollection.isFetched &&
          this.TopStoriesCollection.isFetched)) {
          return this;

        } else {

          if (!window.navigator.onLine) {
            alert('You are not currently connected to the internet. Only previously downloaded and/or saved stories are available. To get the latest news updates, reconnect to the internet.');
            this.isOfflineMode = true;
            $('body').addClass('isOffline');
          }

          var _this = this,
            heros = Mustache.to_html(SingleHeroTemplate, {
              items: this.TopStoriesCollection.contentToArray()
            }),
            breakingNewsFeeds = Mustache.to_html(SingleFeedTemplate, {
              items: this.BreakingNewsCollection.contentToArray()
            }),
            BlogsFeeds = Mustache.to_html(SingleFeedTemplate, {
              items: this.BlogsCollection.contentToArray()
            }),
            TOCFeeds = Mustache.to_html(SingleFeedTemplate, {
              items: this.TOCCollection.contentToArray()
            }),
            TopStoriesFeeds = Mustache.to_html(SingleFeedTemplate, {
              items: this.MostPopularCollection.contentToArray()
            }),
            dots = [],
            i = this.TopStoriesCollection.length - 1,
            parsedDots, filmStrip, parsedTemplate, parsedAdPlaceholder;

          for (; i >= 0; i--) {
            dots.push({
              active: (i < 1) ? true : false,
              index: i
            });
          };

          parsedDots = Mustache.to_html(DotsTemplate, {
            dots: dots.reverse()
          });
          filmStrip = Mustache.to_html(FilmStripTemplate, {
            filmstrips: [{
              filmStipID: 'BreakingNews',
              title: 'Breaking News',
              content: breakingNewsFeeds || ''
            }, {
              filmStipID: 'TOC',
              title: 'This Week\'s Issue',
              content: TOCFeeds || ''
            }, {
              filmStipID: 'Blogs',
              title: 'Blogs',
              content: BlogsFeeds || ''
            }, {
              filmStipID: 'MostPopular',
              title: 'Most Popular',
              content: TopStoriesFeeds || ''
            }]
          });
          parsedTemplate = Mustache.to_html(MainTemplate, {
            heroArticle: heros,
            dots: parsedDots,
            content: filmStrip
          });

          this.$el.html(parsedTemplate);

          if (!this.isOfflineMode) {
            this.Advertisements = new AdModel();
            this.Advertisements.recordImpressions();
            this.Advertisements.fetchAds();
          }

          this.$('.news-category').each(function(index, container) {
            var container = $(container);
            $('div.story:eq(1), div.story:eq(5), div.story:eq(9)', container).after(parsedAdPlaceholder);
          });

          setTimeout(function() {
            _this.updateLayout();

            $('div.news-category', _this.$el).each(function(index, scroll) {
              _this.initializeScroller('#' + $(scroll).attr('id'));
            });

            if (this.$('#heroContainer').length) {
              _this.initializeScroller('#heroContainer', {
                snap: true,
                momentum: false,
                onScrollEnd: function() {
                  $('#indicator li.active').removeClass('active');
                  $('#indicator li:eq(' + (this.currPageX) + ')').addClass('active');
                }
              });
            }

            _this.mainView.trigger('createMainScroll');
            _this.mainView.trigger('hideLoading');
          }, 100);
        }
      },

      updateLayout: function() {
        this.$('#heroContainer div.hero').css({
          width: this.mainView.getAppViewportWidth(40)
        });

        this.$('#heroContainer div.scroller').css({
          width: (this.$('#heroContainer div.hero:first').outerWidth() * this.$('#heroContainer div.hero').length) + 'px'
        });
      },

      events: {
        'click #heroContainer div.hero': 'loadTopStories',
        'click #BreakingNews div.story': 'loadBreakingNews',
        'click #Blogs div.story': 'loadBlogs',
        'click #TOC div.story': 'loadTOC',
        'click #MostPopular div.story': 'loadMostPopularStories',
      },

      loadBreakingNews: function(e) {
        var article = $(e.currentTarget);
        if (article.attr('data-id')) {
          e.preventDefault();

          this.trigger('goToArticle', {
            collection: this.BreakingNewsCollection,
            model: this.BreakingNewsCollection.where({
              id: article.attr('data-id')
            }),
            storageKey: 'BreakingNews',
            page: this.$('#BreakingNews div.story').index(article)
          });
        }
      },

      loadBlogs: function(e) {
        var article = $(e.currentTarget);
        if (article.attr('data-id')) {
          e.preventDefault();

          this.trigger('goToArticle', {
            collection: this.BlogsCollection,
            model: this.BlogsCollection.where({
              id: article.attr('data-id')
            }),
            storageKey: 'Blogs',
            page: this.$('#Blogs div.story').index(article)
          });
        }
      },

      loadTOC: function(e) {
        var article = $(e.currentTarget);
        if (article.attr('data-id')) {
          e.preventDefault();

          this.trigger('goToArticle', {
            collection: this.TOCCollection,
            model: this.TOCCollection.where({
              id: article.attr('data-id')
            }),
            storageKey: 'TOC',
            page: this.$('#TOC div.story').index(article)
          });
        }
      },

      loadTopStories: function(e) {
        var article = $(e.currentTarget);
        if (article.attr('data-id')) {
          e.preventDefault();

          this.trigger('goToArticle', {
            collection: this.TopStoriesCollection,
            model: this.TopStoriesCollection.where({
              id: article.attr('data-id')
            }),
            storageKey: 'TopStories',
            page: this.$('#heroContainer div.hero').index(article)
          });
        }
      },

      loadMostPopularStories: function(e) {
        var article = $(e.currentTarget);
        if (article.attr('data-id')) {
          e.preventDefault();

          this.trigger('goToArticle', {
            collection: this.MostPopularCollection,
            model: this.MostPopularCollection.where({
              id: article.attr('data-id')
            }),
            storageKey: 'MostPopular',
            page: this.$('#MostPopular div.story').index(article)
          });
        }
      },

      saveAllArticlesToLocalStorage: function(collection, sk) 
      {
        var articles = collection.models,
            saveAll = new ArticlesCollection(articles, sk),
            model = ( saveAll.hasOwnProperty('models') ) ? collection.where({ id: saveAll.models[0].get('id') }) : null,
            model = ( model !== null ) ? collection.get(model[0]) : null;
            
        if( model !== null ) saveAll.getArticle( model );
      }

    });

  });