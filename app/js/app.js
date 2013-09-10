require(
  ['jquery', 'underscore', 'backbone', 'router', 'views/main.view'], 
  function ( $, _, Backbone, Router, appView ) {

    function updateOrientationClass (orientation) {
      var elem = document.documentElement,
        parsedOrientation;

      if ( typeof(orientation) === 'string' ) {
        parsedOrientation = orientation;
      } else {
        var isPortrait = elem && elem.clientWidth / elem.clientHeight < 1.1;
        parsedOrientation = isPortrait ? "portrait" : "landscape";
      }

      if(parsedOrientation === 'portrait'){
        $('body').addClass('portrait');
        $('body').removeClass('landscape');
      }else if(parsedOrientation === 'landscape') {
        $('body').addClass('landscape');
        $('body').removeClass('portrait');
      }

      $('#loading-screen-content').css({ marginTop: Math.floor(($(document).innerHeight() - $("#loading-screen-content").innerHeight()) / 2) + 'px' });

    }

    $.extend($.easing, {
      def: 'easeInOutQuint',
      easeInOutQuint: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
        return c/2*((t-=2)*t*t*t*t + 2) + b;
      }
    });

    $(function() {
      // UA Sniffing for Kindle Devices
      if(/Kindle/gi.test(navigator.userAgent) || /Silk/gi.test(navigator.userAgent)){
        $('body').addClass('kindle');
      }

      updateOrientationClass(($('html')[0].clientWidth > $('html')[0].clientHeight) ? 'landscape' : 'portrait');

      var app = new appView();
      var router = new Router({
        mainView: app
      });

      $(window).on({
        resize: function (e) {
          setTimeout(function () {
            updateOrientationClass();

            app.updateLayout();
          }, 500);
        }
      });

      Backbone.history.start();
    });
});