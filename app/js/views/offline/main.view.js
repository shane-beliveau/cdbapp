define([
  'backbone','underscore', 'mustache', 'iscroll',
  'views/article',
  'models/ad.model',
  'text!templates/breadcrumbs.html',
  'text!templates/subscription.html',
  'text!templates/offline/ad.html'
], function (Backbone, _, Mustache, iScroll, ArticleView, AdModel, BreadcrumbsTemplate, SubscriptionTemplate, AdTemplate) {

    return Backbone.View.extend({
      el: '#app-wrapper',
      loading: false,

      initialize: function () {
        this.on({
          'showLoading': this.showLoading,
          'hideLoading': this.hideLoading,
          'createMainScroll': this.createMainScroll,
          'destroyMainScroll': this.destroyMainScroll,
          'refreshMainScroll': this.refreshMainScroll
        }, this);

        this.$('#main-navigation a.section-link[href="'+location.hash+'"]', this.$el).addClass('active');

        this.render();
      },

      createMainScroll: function () {
        this.updateMainScrollContainer();

        this.mainScroll = new iScroll($('#content-wrapper')[0],{
          momentum: true,
          hScrollbar: false,
          vScrollbar: false,
          hScroll: false
        });
      },

      destroyMainScroll: function () {
        if (this.mainScroll) {
          this.mainScroll.destroy();
          this.mainScroll = '';
        }
      },

      refreshMainScroll: function (scrollHeight) {
        this.updateMainScrollContainer(scrollHeight);
        if ( this.mainScroll ) {
          this.mainScroll.refresh();
        }
      },

      updateMainScrollContainer: function (contentHeight) {
        if ( !contentHeight ){
          var contentHeight = (
            $('#content-wrapper div#subscription:visible').outerHeight(true) +
            $('#content-wrapper div#content:visible').outerHeight(true)
          );
        }

        $('#content-wrapper > div.scroller').css({
          height: contentHeight + 'px'
        });

        $('#content-wrapper').css({
          height: this.getAppViewportHeight(100)
        });
      },

      render: function () {
        var subscriptionTemplate = Mustache.to_html(SubscriptionTemplate);
        this.$('div#subscription', this.$el).html(subscriptionTemplate);

        this.renderAds(this.$('.ad'));
      },

      renderAds: function (placeholders, opts) {

        placeholders.each(function (index, el) {

          var adContainer = $(el),
            adModel = new AdModel(_.extend({
              pos: adContainer.attr('data-position')
            }, opts)),
            adTemplateParsed = Mustache.to_html(AdTemplate, { ad: adModel.attributes });

          adContainer.html(adTemplateParsed);
        });
      },

      showLoading: function () {
        this.loading = true;
        $('#loading-screen').show();

        return this;
      },

      hideLoading: function () {
        setTimeout(function(){
          this.loading = false;
          $('#loading-screen').hide();
        }, 1500);

        return this;
      },

      events: {
        'click div.header-dock a.section-link': 'navigate',
        'click div.header-dock a#backToMyTopics': 'backToMyTopics',
        'click #main-navigation a.refresh': 'refresh',
        'click #subscribe-toggle': 'subscribeToggle'
      },

      backToMyTopics: function () {
        $('#main-navigation a[href="#mytopics"]', this.$el).trigger('click');
      },

      updateNavigation: function () {
        if(this.currentSection === '#mytopics'){
          this.$('#editTopics', this.$el).removeClass('hide');
        }else{
          this.$('#editTopics', this.$el).addClass('hide');
        }

        if(this.currentSection === '#editTopics'){
          this.$('#backToMyTopics', this.$el).removeClass('hide');
        }else{
          this.$('#backToMyTopics', this.$el).addClass('hide');
        }

        if(this.currentSection === '#article') {
          this.$('div.header-dock a.section-link').removeClass('active');
        }

        this.$('div.header-dock a.section-link[href="'+this.currentSection+'"]').addClass('active');
      },

      navigate: function (e) {
        var element = this.$(e.target);

        if ( !element.hasClass('active') && !element.hasClass('side-option') ){
          this.trigger('showLoading');

          this.currentSection = $(e.target).attr('href');
          this.updateNavigation();

          this.$('div.header-dock a.section-link', this.$el).removeClass('active');
          this.$(e.target).addClass('active');
        } else {
          e.preventDefault();
        }
      },

      refresh: function (e) {
        e.preventDefault();

        this.trigger('showLoading');
        this.trigger('reload');
      },

      subscribeToggle: function (e) {
        e.preventDefault();

        var _this = this;

        this.$('div#subscription', this.$el).slideToggle(300, function () {
          _this.updateMainScrollContainer();

          if ( _this.mainScroll ) {
            _this.mainScroll.refresh();
          }
        });

        this.$(e.target).toggleClass('white');
      },

      getAppViewportHeight: function (offset) {
        return ($('html')[0].clientHeight - offset) + 'px';
      },

      getAppViewportWidth: function (offset) {
        return ($('html')[0].clientWidth - offset) + 'px';
      },

      updateLayout: function (e) {
        if ( this.currentSection === '#mhwire' || this.currentSection === '#mybriefcase' ) {
          this.$('.content-area', this.$el).css({
            height: this.getAppViewportHeight(100)
          });
        } else {
          this.$('.content-area', this.$el).css({
            height: '100%'
          });
        }

        this.$('#loading-screen', this.$el).css({
          height: this.getAppViewportHeight(0)
        });

        this.$('#fullPageAd').css({
          height: this.getAppViewportHeight(0),
          width: this.getAppViewportWidth(0)
        });

        this.trigger('updateLayout');

        if ( this.mainScroll ) {
          this.trigger('refreshMainScroll');
        }
      },

      updateBreadcrumbs: function(items) {
        var breadcrumbsTemplace = Mustache.to_html(BreadcrumbsTemplate, { breadcrumbs:items });

        this.$('div#breadcrumbs-container', this.$el).html(breadcrumbsTemplace);
      }

    });

});