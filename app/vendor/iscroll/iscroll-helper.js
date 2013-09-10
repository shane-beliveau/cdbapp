define([
  'iscroll', 'jquery'
], function( iScroll, $ ) {

  return (function(){
    function initialize (scroller, opts) {
      sanitize(scroller.children(':first-child'));
      var scroll = new iScroll(scroller[0], opts);

      return scroll;
    }

    function destroy (scroller) {
      scroller[0].destroy();

      return this;
    }

    function refresh (scroller) {
      scroller[0].refresh();

      return this;
    }

    function sanitize ( container ) {
      var scrollWrapper = container.closest('.scroll-wrapper'),
        scrollContent = $(scrollWrapper).children(':first-child'),
        childs = $('.scroll-item', scrollWrapper),
        height = 0,
        width = 0,
        scrollType = scrollWrapper.hasClass('scroll-horizontal') ? 'x' : 'y' ;

      if( scrollType === 'x' ){
        $.each(childs, function(index, child){
          width += $(child).outerWidth(true);
        });

        scrollContent.css({ width: width });
      } else {
        $.each(childs, function(index, child){
          height += $(child).outerHeight(true);
        });

        scrollContent.css({ height: height });
      }

      return this;
    }

    return {
      init: initialize,
      destroy: destroy,
      sanitize: sanitize,
      refresh: refresh
    }
  }());
});