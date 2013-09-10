define([
  'backbone','underscore','mustache', 'iscrollHelper',
  'collections/mytopics.feeds',
  'text!templates/mytopics/edit.html'
],
  function (Backbone, _, Mustache, iscrollHelper, TopicsCollection, MainTemplate) {

    return Backbone.View.extend({
      el: '#content',
      name: 'My Topics',
      scrollers: {},

      initialize: function (options) {
        this.mainView = options.mainView;
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', this.updateLayout, this);
        this.mainView.currentSection = '#editTopics';
        this.mainView.updateNavigation();

        this.collection = new TopicsCollection();
        this.collection.on('ready', this.render, this);

        this.mainView.updateBreadcrumbs([this.name, 'Edit Topics']);
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

        this.mainView.off('reload');
        this.mainView.off('updateLayout');

        this.$el.off();
        this.$el.empty();

        return this;
      },

      render: function () {
        var _this = this,
          content = this.collection.contentToArray(),
          parsedTemplate = Mustache.to_html(MainTemplate, { topics: content });

        this.$el.html(parsedTemplate);

        setTimeout(function(){
          _this.initializeScroller('#editTopics');
        }, 0);

        this.mainView.trigger('hideLoading');
        this.mainView.trigger('updateLayout');
      },

      updateLayout: function () {
        _.each(this.scrollers, function (scroll) {
          scroll.refresh();
        });

        var appViewportHeight = this.mainView.getAppViewportHeight(100);
        this.$('div.scroll-wrapper', this.$el).css({
          height: appViewportHeight
        });
      },

      events: {
        'mousedown li.topic h4': 'updateSubscription',
      },

      updateSubscription: function (e) {
        e.preventDefault();

        var el = this.$(e.target);
        this.collection.subscribeTopic(el.attr('data-id'));
        el.toggleClass('selected');
      }

    });

});