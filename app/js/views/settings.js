define([
  'backbone','underscore','mustache', 'iscrollHelper',
  'text!templates/settings.html'
],
  function (Backbone, _, Mustache, iscrollHelper, MainTemplate) {

    return Backbone.View.extend({
      el: '#content',
      name: 'Settings',
      scrollers: {},

      initialize: function (opts) {
        this.mainView = opts.mainView;
        this.mainView.currentSection = '#settings';

        this.mainView.updateLayout();
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', this.refreshScrollers, this);

        this.render();
      },

      initializeScroller: function (container, opts) {
        var config = _.extend({
          momentum: true,
          hScrollbar: false,
          vScrollbar: false
        }, opts);

        this.scrollers[container] = iscrollHelper.init(this.$(container).find('div.scroll-wrapper'), config);
      },

      refreshScrollers: function () {
        this.updateLayout();

        _.each(this.scrollers, function (scroll) {
          scroll.refresh();
        });
      },

      reloadContent: function () {
        var mainView = this.mainView;

        mainView.trigger('hideLoading');
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
      },

      render: function () {
        var _this = this,
          parsedTemplate = Mustache.to_html(MainTemplate);

        this.$el.html(parsedTemplate);

        setTimeout(function () {
          _this.updateLayout();

          _this.initializeScroller('#settingsContainer', { 
            snap: true, 
            momentum: false,
            onScrollEnd: function () {
              $('#utility-nav a.active').removeClass('active');
              $('#utility-nav a:eq(' + (this.currPageX) + ')').addClass('active');

              var ContentHeight = $('div.scroll-item:eq(' + (this.currPageX) + ')', _this.$el).outerHeight();
              $('#settingsContainer').css({
                height: ContentHeight + 'px',
                overflow: 'hidden'
              });
              _this.mainView.trigger('refreshMainScroll', (ContentHeight + 35));

              _this.mainView.updateBreadcrumbs([_this.name, _this.getSectionName()]);
            },
          });

          _this.mainView.updateBreadcrumbs([_this.name, _this.getSectionName()]);
          _this.mainView.trigger('createMainScroll');
          _this.mainView.trigger('hideLoading');
        }, 0);
      },

      updateLayout: function () {
        this.$('#settingsContainer').css({
          width: this.mainView.getAppViewportWidth(0)
        });

        this.$('#settingsContainer div.scroll-item').css({
          minHeight: this.mainView.getAppViewportHeight(100),
          width: this.mainView.getAppViewportWidth(40)
        });

        this.$('#settingsContainer div.scroller').css({
          width: (this.$('#settingsContainer div.scroll-item:first').outerWidth() * this.$('#settingsContainer div.scroll-item').length) + 'px'
        });

        this.updateFeedbackLabel();
      },

      updateFeedbackLabel: function () {
        var label = 'Send Us your Feedback';
        if ( $('body').hasClass('portrait') ) {
          label = 'Feedback';
        }

        this.$('.sendfeedback').text(label);
      },

      getSectionName: function () {
        return $('#utility-nav a.active:first').text();
      },

      events: {
        'click #utility-nav a': 'scrollToSection'
      },

      scrollToSection: function (e) {
        e.preventDefault();

        var el = $(e.target),
          targetIndex = $('#utility-nav a').index(el);

        this.scrollers['#settingsContainer'].scrollToPage(targetIndex,0,500);
      }

    });

});