define([
  'backbone','underscore','mustache', 'iscrollHelper',
  'collections/articles',
  'collections/mybriefcase.feeds',
  'views/ad',
  'models/user',
  'text!templates/article/main.html',
  'text!templates/article/content.html',
  'text!templates/article/preview.html',
  'text!templates/article/meter_expired.html',
  'text!templates/dots.html',
  'utils'
],
  function (Backbone, _, Mustache, iscrollHelper, ArticlesCollection, MyBriefcaseCollection, FullPageAdView, UserModel, MainTemplate, ArticleContentTemplate, ArticlePreviewTemplate, ArticleMeterExpiredTemplate, DotsTemplate, Utils) {

    return Backbone.View.extend({
      el: '#content',
      name: 'Article',
      scrollers: {},

      pageSwipesCount: -1,
      hasAccess : 0,

      adZone: {
        kindle: {
          landscape: '',
          portrait: ''
        },
        landscape:      ( screen.width <= 640 ) ? 'x85' : 'x94',
        portrait:       ( screen.width <= 640 ) ? 'x85' : 'x89',
        fullPage:       ( screen.width <= 640 ) ? 'x86' : 'x95',
        fullPagePortrait:   ( screen.width <= 640 ) ? 'x87' : 'x96'
      },

      initialize: function(opts) {

        var storageKey = (opts.hasOwnProperty('storageKey')) ? opts.storageKey : Utils.getParamFromQueryString('sk');

        // Store reference to main view
        this.mainView = opts.mainView;
        this.mainView.currentSection = '#article';

        // Run methods from main.view and set up events
        this.mainView.updateNavigation();
        this.mainView.updateLayout();
        this.mainView.on('reload', this.reloadContent, this);
        this.mainView.on('updateLayout', function() { 
          this.refreshScrollers();
          this.checkSwipes();
        }, this);

        // Get the article collection
        var articles = (opts.hasOwnProperty('collection')) ? opts.collection.models : '';
          this.mybriefcase = new MyBriefcaseCollection();
          this.collection = new ArticlesCollection(articles, storageKey);
          this.collection.on('change:article', this.renderArticle, this);

        // Add the common.single.story model to object and set up events
        this.model = (opts.hasOwnProperty('model')) ? this.collection.get(opts.model[0]) : this.collection.at(0);

        // Add the user model to object and set up events
        this.mainView.UserModel.on('userStored.article userLoggedOut.article', 
          function() {
            this.applyMeter();
          }, this);

        // Set ad rendering option
        this.renderAds = true;

        // Metering options
        this.checkMeterExpiry();

        // Render the article
        this.render();

        // Update the breadcrumbs
        this.mainView.updateBreadcrumbs([this.name]);

      },

      initializeScroller: function (container, opts) {
        var config = _.extend({
          momentum: false,
          hScrollbar: false,
          vScrollbar: false,
          minDistance: 200
        }, opts);

        this.scrollers[container] = iscrollHelper.init(this.$(container).find('div.scroll-wrapper'), config);
      },

      refreshScrollers: function () {
        this.updateLayout();

        _.each(this.scrollers, function (scroll) {
          scroll.refresh();
          scroll.scrollToPage(scroll.currPageX, 0, 100);
        });

        this.renderAdsInView();
      },

      reloadContent: function () {
        this.trigger('closeArticle');
      },

      destroy: function () {
        _.each(this.scrollers, function (scroll) {
          scroll.destroy();
        });

        this.mainView.trigger('destroyMainScroll');
        this.mainView.off('reload');
        this.mainView.off('updateLayout');

        $('#indicatorContainer').html('').hide();

        this.$el.off();
        this.$el.empty();
      },

      render: function () {
        var _this = this,
          dots = [],
          articleIndex, parsedDots, parsedTemplate, parsedAdPlaceholder, i, previousPageIndex;

        parsedTemplate = Mustache.to_html(MainTemplate, {
          articles: this.collection.contentToArray()
        });
        this.$el.html(parsedTemplate);

        articleIndex = $('div.scroll-item').index( $('div.scroll-item[data-id="' + this.model.get('id') + '"]') );
        i = (this.$('div.scroll-item').length - 1);
        for (; i >= 0; i--) {
          dots.push({
            active: (i == articleIndex) ? true : false,
            index: i
          });
        };
        parsedDots = Mustache.to_html(DotsTemplate, { dots: dots.reverse() });
        $('#indicatorContainer').html(parsedDots).show();

        // Update Layouts
        $('#ArticlesContainer div.article').css({
          minHeight: this.mainView.getAppViewportHeight(100),
        });
        $('#ArticlesContainer').show();
        setTimeout(function () {
          _this.updateLayout();

          _this.initializeScroller('#ArticlesContainer', { 
            currPageX: articleIndex,
            snap: true, 
            momentum: false,
            vScroll:false,
            onScrollEnd: function () {
              var currentPageEl = _this.$('div.article:eq(' + (this.currPageX) + ')'),
                modelID = currentPageEl.attr('data-id'),
                isRender = currentPageEl.hasClass('render');
                _this.model = _this.collection.get(modelID);

              if ( previousPageIndex !== this.currPageX && !currentPageEl.hasClass('active') ) 
              {
                
                _this.pageSwipesCount++;
                _this.checkSwipes();
                _this.checkMeterExpiry();

                previousPageIndex = this.currPageX;

                $('#indicator li.active').removeClass('active');
                $('#indicator li:eq(' + (this.currPageX) + ')').addClass('active');

                $('div.article.active', _this.$el).removeClass('active');
                currentPageEl.addClass('active');

                if ( !isRender ) 
                {
                  if ( !_this.model.get('article') ) 
                  {
                    _this.collection.getArticle(_this.model);
                  } 
                  else 
                  {
                    _this.renderArticle(_this.model);
                  }
                } 
                else 
                {

                  var ContentHeight = currentPageEl.outerHeight();
                  $('#ArticlesContainer').css({
                    height: ContentHeight + 'px',
                    overflow: 'hidden'
                  });
                  _this.mainView.trigger('refreshMainScroll', (ContentHeight + 35));
                  
                  if(_this.renderAds) _this.renderAdsInView();

                }

                _this.applyMeter({ skipRender: true });

              }

              // Reset the ad rendering
              _this.renderAds = true;

              _this.updateBriefcaseButton();
              _this.mainView.updateBreadcrumbs([_this.name]);
              if (_this.mainView.mainScroll) {
                _this.mainView.mainScroll.scrollTo(0,0, 100, false);
              }
            },
          });
          _this.scrollers['#ArticlesContainer'].scrollToPage(articleIndex, 0, 0);

          _this.mainView.trigger('createMainScroll');
          _this.mainView.trigger('hideLoading');
          _this.linkAttrBlank();
          _this.engageVideo();
        }, 0);
      },

      renderArticle: function(model) {

        var id            = model.get('id'),
          groupid         = model.get('groupid'),
          container       = $('#ArticlesContainer div#article-' + id),
          parsedTemplate  = Mustache.to_html(ArticleContentTemplate, model.toJSON()),
          previewTemplate = Mustache.to_html(ArticlePreviewTemplate, model.toJSON()),
          meterExpiredTemplate = Mustache.to_html(ArticleMeterExpiredTemplate, model.toJSON()),
          _this           = this;

          // Set the user access for this story
          this.setUserAccess();

          // Check to see if item has any content before rendering
          if( model.get('processed') )
          {
            // Determine which template to show based on the user's access levels
            parsedTemplate  = ( this.hasAccess || !this.anonMeterExpired || !this.regMeterExpired ) ? parsedTemplate : ( this.anonMeterExpired || this.regMeterExpired ) ? meterExpiredTemplate : previewTemplate;

            // Load the content into the article container
            $('#ArticlesContainer div#article-' + id).addClass('render');
            $('#ArticlesContainer div#article-' + id).append(parsedTemplate);

            // Update Layouts
            var ContentHeight = $('#ArticlesContainer div#article-' + id).outerHeight();
            $('#ArticlesContainer').css({
              height: ContentHeight + 'px',
              overflow: 'hidden'
            });
            // Hide briefcase if not a subscriber
            if( !this.mainView.UserModel.get('isSubscriber') )
            {
              $('a.addtobriefcase').hide();
            }
            else
            {
              $('a.addtobriefcase').show();
            }

            this.mainView.trigger('refreshMainScroll', (ContentHeight + 35));

            this.renderAdsInView();
          }
      },

      renderAdsInView: function () {

        if ($('body').hasClass('kindle')) {
          this.$('.ad').attr('data-position', ($('body').hasClass('landscape')) ? this.adZone.kindle.landscape : this.adZone.kindle.portrait);
        } else {
          this.$('.ad').attr('data-position', ($('body').hasClass('landscape')) ? this.adZone.landscape : this.adZone.portrait);
        }

        var viewable_position 	= $('.article.active').find('.ad').attr('data-position'),
        	render_this_ad		= $('.article.active').find('.ad[data-position="'+ viewable_position +'"]');
        
        if( render_this_ad !== "undefined" && typeof render_this_ad.html() !== "undefined" )
        {
        	if( render_this_ad.html().indexOf('@' + viewable_position) === -1 )
        	{
        		this.mainView.renderAds( render_this_ad );
        	}
        }
      },

      // Gets the user info and decides whether the user has access to story
      setUserAccess: function() {
        this.usergid   = this.mainView.UserModel.get('effectiveGID');
        this.hasAccess = ( this.model.get('groupid') === null || this.model.get('groupid') === undefined ) ? 1 : ( (this.model.get('groupid') & this.usergid) <= 0 ) ? 0 : 1;
      },

      checkMeterExpiry: function()
      {
        // Get the meter count.
        this.anonMeterExpired = ( this.mainView.UserModel.get('anon_meter') === 0 ) ? true : false;
        this.regMeterExpired  = ( this.mainView.UserModel.get('reg_meter') === 0 ) ? true : false;    
      },

      applyMeter: function (opts)
      {
          var skipRender    = ( typeof opts == 'object' && opts.hasOwnProperty('skipRender') ) ? opts.skipRender : false,
              skipCount     = ( typeof opts == 'object' && opts.hasOwnProperty('skipCount') ) ? opts.skipCount : false,
              reRender      = false,
              countMeter    = this.model.get('isMetered') || false,
              isRegistrant  = this.mainView.UserModel.get('isRegistrant'),
              isAnonymous   = this.mainView.UserModel.get('isAnonymous');

          // Check if the anonymous meter or registered meter is expired
          if( ( this.anonMeterExpired && isAnonymous ) || ( this.regMeterExpired && isRegistrant ) )
          {
            reRender = true;
          }

          // Count the meter.
          if( countMeter  && !skipCount )
          {
            this.mainView.UserModel.countMeter();
          }

          // Re-render the article templates if either meter is expired.
          if(reRender && !skipRender)
          {
            this.renderAds = false;
            this.render();
          }
          
      },

      checkSwipes: function () {

      	this.updateLayout();
        
        if( 
        	( (this.pageSwipesCount > 0) && (this.pageSwipesCount % 3) === 0 ) 
        	||
        	( typeof this.fullPageAdView !== "undefined" && typeof this.fullPageAdView.options.is_open !== "undefined" && this.fullPageAdView.options.is_open === true )
          ){
          
          this.fullPageAdView = new FullPageAdView({
            position: $('body').hasClass('landscape') ? this.adZone.fullPage : this.adZone.fullPagePortrait,
            is_open: true
          });

          if(this.renderAds) this.fullPageAdView.render();
          this.pageSwipesCount = 0;
        }
        

      },

      updateLayout: function () {

        this.$('#ArticlesContainer div.article').css({
          minHeight: this.mainView.getAppViewportHeight(100),
          width: this.mainView.getAppViewportWidth(0)
        });
      },

      events: {
        'click .closearticle': 'closeArticle',
        'click .addtobriefcase': 'updateBriefcase'
      },

      closeArticle: function (e) {
        e.preventDefault();
        this.mainView.trigger('showLoading');

        this.trigger('closeArticle');
      },

      updateBriefcase: function (e) {
        e.preventDefault();

        var model = this.model;

        // this.mybriefcase[(this.mybriefcase.get(model)) ? 'remove' : 'add'].call(this, model);
        if (this.mybriefcase.get(model)) this.mybriefcase.remove(model);
        else this.mybriefcase.add(model);

        this.updateBriefcaseButton();
      },

      updateBriefcaseButton: function () {
        var exists = (this.mybriefcase.get(this.model)) ? true : false,
          label = (exists) ? 'Remove From Briefcase' : 'Add To Briefcase';

        this.$('div.article.active .addtobriefcase').text(label);
      },

      linkAttrBlank: function() {
        $(".article-content a").attr("target","_blank");
      },

      engageVideo: function () {
        $(".widescreenVideo a").click(function(e) {
          e.preventDefault();
          if ($("body").hasClass("isOffline")) { 
            //DO Nothing
          } else {
            var playerUrl = $(this).attr("href");
            var videoHtml = '<iframe src="' + playerUrl + '" scrolling="no"></iframe>';
            $(this).parent().html(videoHtml);
          }
        });
      }

    });

});