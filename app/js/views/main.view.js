define([
  'backbone','underscore', 'mustache', 'iscroll',
  'views/article',
  'models/ad.model',
  'models/user',
  'text!templates/breadcrumbs.html',
  'text!templates/subscription.html',
  'text!templates/ad.html'
], function (Backbone, _, Mustache, iScroll, ArticleView, AdModel, UserModel, BreadcrumbsTemplate, SubscriptionTemplate, AdTemplate) {

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

        // Add a user model instance
        this.UserModel = new UserModel();

        // Hide briefcase if not a subscriber
        if( !this.UserModel.get('isSubscriber') )
        {
          $('.section-link[href="#mybriefcase"]').hide();
        }

        this.UserModel.on({
          'loginFailed'   : this.render,
          'userStored.main'   : function() {
            if( this.UserModel.loginStatus() )
            {
              this.toggleUserInfo({
                slideup: true
              });
            }
            if( this.UserModel.get('isSubscriber') )
            {
              $('.section-link[href="#mybriefcase"]').show();
            }
          },
          'userLoggedOut.main' : function() {
            this.toggleUserInfo();

            // Hide briefcase if not a subscriber
            if( !this.UserModel.get('isSubscriber') )
            {
              $('.section-link[href="#mybriefcase"]').hide();
            }
            
          }
        }, this);

        // Try to login the user if they were already logged into the site previously
        this.doUserLogin();

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
        var subscriptionTemplate = Mustache.to_html(SubscriptionTemplate, {
          errorMsg : this.UserModel.lastError
        });
        this.$('div#subscription', this.$el).html(subscriptionTemplate);

        // Set up the login form actions
        this.loginFormActions();
        
        // Render ads
        this.renderAds(this.$('.ad'));

        // Ads focus to inputs when testing on desktop
        $(document).off('click.text_inputs');
        $(document).off('focus.text_inputs');
        $(document).off('blur.text_inputs');

        $(document).on('click.text_inputs', 'input[type="email"],input[type="password"]', function(){
            $(this).focus();
        });
        $(document).on('click.text_inputs', '.field.submit input', function(){
            $('input[type="email"],input[type="password"]').blur();
        });
        $(document).on('focus.text_inputs', 'input[type="email"],input[type="password"]', function(){
            $('body').addClass('fix-fixed');
        });
        $(document).on('blur.text_inputs', 'input[type="email"],input[type="password"]', function(){
            $('body').removeClass('fix-fixed');

            $('html,body').animate({ 
                  scrollTop: 0 }
                  , 300
              );

        });
      },

      loginFormActions: function() {

        var _this = this;

        // Login form actions
        $('#CSLogin').on('submit.login', 'form[name="CSLogin"]', function(e) {

          // Prevent the login form from submitting
          e.preventDefault();

          var $this = $(this);

          // Get the form values and pass to method
          _this.doUserLogin({
            CSUsername: $this.find('[name="CSUsername"]').val(),
            CSPassword: $this.find('[name="CSPassword"]').val()
          });

          // Show authenticating message while loading
          $this.html('<h2>Authenticating...</h2>');

          // Prevent from multiple events attaching
          $('#CSLogin').off('submit.login');

        });

        // Fade out the last error message after a certain amount of time if exists
        if( $('#CSLogin .errorMsg').html().length )
        {
          clearTimeout(this.errorMsgTimeout);
          
          this.errorMsgTimeout = setTimeout( function(){
            $('#CSLogin .errorMsg').fadeOut('slow');
          }, 3000);
        }

      },

      doUserLogin: function(opts) {
        this.UserModel.authenticate(opts);
      },

      logoutUser: function() {
        this.UserModel.logoutUser();
      },

      toggleUserInfo: function(opts) {
        var _this = this;
          opts  = opts || {};

        // Slide up if logged in
        if( opts.slideup && !$('#subscription').is(':hidden, :animated') ) 
        {
          $('html,body').animate({ 
                  scrollTop: 0 }
                  , 300
              );

          setTimeout( function() { 
            _this.subscribeToggle()
          } , 1250 );
        }

        if( this.UserModel.loginStatus() )
        {
          // Show username and GID
          $('#CSLogin').parent().find('h3').html('Thank you for logging in.');
          $('#CSLogin').parent().find('p').remove();

          $('#CSLogin').html('<strong>Logged in as: ' + this.UserModel.get('username') + '</strong> <br/><br/> <strong>Current GID: ' + this.UserModel.get('effectiveGID') + '</strong> <br/><br/> <form id="logout"><input type="submit" class="button white" value="Logout" /></form>');

          var first_name = ( this.UserModel.get('name_first') ) ? this.UserModel.get('name_first') : 'Guest'
          $('#subscribe-toggle, #subscribe-toggle-nav').html('Welcome ' + first_name );

          // Prevent from multiple events attaching
          $('#logout').off('submit.logout');
          $('#logout').on('submit.logout', function(e) {

            // Prevent from linking
            e.preventDefault();

            // Call logout method
            _this.UserModel.logoutUser();

          });

        }
        else
        {
          var subscriptionTemplate = Mustache.to_html(SubscriptionTemplate, {
            errorMsg : this.UserModel.lastError
          });

          this.$('div#subscription', this.$el).html(subscriptionTemplate);
          $('#subscribe-toggle, #subscribe-toggle-nav').html('Login / Subscribe');
          this.loginFormActions();
        }
      },

      renderAds: function (placeholders, opts) {

      	var rns = Math.floor((Math.random() * 999999999) + 100000000);

        placeholders.each(function (index, el) {

          var adContainer 	= $(el);
		      var position 		= adContainer.attr('data-position');
          	  rns 			= ( position == 'x88') ? Math.floor((Math.random() * 999999999) + 100000000) : rns;

          var adModel = new AdModel(_.extend({
              pos: position,
              OAS_rns: rns
            }, opts));

          var adTemplateParsed = Mustache.to_html(AdTemplate, { ad: adModel.attributes });

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
        'click #subscribe-toggle': 'subscribeToggle',
        'click .login-toggle': 'subscribeToggle'
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

      subscribeToggle: function(e) {

        if(typeof e === 'object') e.preventDefault();

        var _this = this;
          el = this.$('div#subscription', this.$el);

        if( !el.is(':animated') )
        {
          el.slideToggle(300, function() {

            _this.updateMainScrollContainer();

            if (_this.mainScroll) {
              _this.mainScroll.refresh();
            }

            
          });
        }

        this.$('#subscribe-toggle').toggleClass('white');
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