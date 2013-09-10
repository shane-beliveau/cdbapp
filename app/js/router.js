define([
  'backbone',
  'views/thenews',
  'views/mytopics',
  'views/edittopics',
  'views/mybriefcase',
  'views/mhwire',
  'views/article',
  'views/settings'
], function ( Backbone, TheNewsView, MyTopicsView, EditTopicsView, MyBriefcaseView, MhWireView, ArticleView, SettingsView ) {

    var view;

    return Backbone.Router.extend({

      routes: {
        'thenews': 'initTheNews',
        'mytopics': 'initMyTopics',
        'editTopics': 'initEditTopics',
        'mybriefcase': 'initMyBriefcase',
        'mhwire': 'initMhWire',
        'article/:storageKey/:page': 'initArticle',
        'settings': 'initSettings',
        '': 'init'
      },

      initialize: function (options) {
        this.mainView = options.mainView;
        this.articleOpts = {
          mainView: this.mainView
        }

        this.on('route', this.trackPageview, this);
      },

      trackPageview: function () {
        var url = Backbone.history.getFragment();

        //prepend slash
        if (!/^\//.test(url) && url != "") {
            url = "/" + url;
        }

        _gaq.push(['_trackPageview', url]);
      },

      init: function () {
        this.navigate('thenews', { replace: true, trigger: true });
      },

      destroyView: function () {
        if ( view ) {
          view.destroy();
        }
      },

      initTheNews: function () {
        this.destroyView();

        view = new TheNewsView({
          mainView: this.mainView
        });

        view.on('goToArticle', function (opts) {
          this.articleOpts = _.extend(this.articleOpts, opts);

          this.navigate('article/' + opts.storageKey + '/' + opts.page, { trigger: true });
        }, this);
      },

      initMyTopics: function () {
        this.destroyView();

        view = new MyTopicsView({
          mainView: this.mainView
        });

        view.on('goToArticle', function (opts) {
          this.articleOpts = _.extend(this.articleOpts, opts);

          this.navigate('article/' + opts.storageKey + '/' + opts.page, { trigger: true });
        }, this);
      },

      initEditTopics: function () {
        this.destroyView();

        view = new EditTopicsView({
          mainView: this.mainView
        });
      },


      initMyBriefcase: function () {
        this.destroyView();

        view = new MyBriefcaseView({
          mainView: this.mainView
        });

        view.on('goToArticle', function (opts) {
          this.articleOpts = _.extend(this.articleOpts, opts);

          this.navigate('article/' + opts.storageKey + '/' + opts.page, { trigger: true });
        }, this);
      },

      initMhWire: function () {
        this.destroyView();

        view = new MhWireView({
          mainView: this.mainView
        });
      },

      initArticle: function (storageKey, page) {
        this.destroyView();

        view = new ArticleView(_.extend(this.articleOpts, {
          storageKey: storageKey,
          currentPage: page
        }));

        view.on('closeArticle', function () {
          var history = window.history;

          if ( history.length > 1 ) {
            history.back();
          } else {
            this.navigate('thenews', { trigger: true });
          }
        }, this);
      },

      initSettings: function () {
        this.destroyView();

        view = new SettingsView({
          mainView: this.mainView
        });
      }

  });
});