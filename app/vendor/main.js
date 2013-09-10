var SiteScrollers = (function( $ ) {
  var instances = [];

  function initialize ( context, opts ) {
    destroy();
    var scrollers = $('div.scroll-wrapper', $('#'+context)),
      elsQty = scrollers.length - 1;

    for (; elsQty >= 0; elsQty--){
      var el = scrollers.eq(elsQty);

      sanitize(el.children(':first-child'));

      var scroll = new iScroll(scrollers[elsQty], opts);

      instances.push(scroll);
    };
  }

  function destroy () {
    var elsQty = instances.length - 1;
    for (; elsQty >= 0; elsQty--) {
      instances[elsQty].destroy();
    };
  }

  function refresh () {
    var elsQty = instances.length - 1;
    for (; elsQty >= 0; elsQty--) {
      instances[elsQty].refresh();
    };
  }

  function sanitize ( container ) {
    var scrollWrapper = container.parents('.scroll-wrapper'),
      scrollContent = $(scrollWrapper).children(':first-child'),
      childs = $('.scroll-item',container),
      height = childs[0].offsetHeight,
      width = childs[0].offsetWidth,
      scrollType = scrollWrapper.hasClass('scroll-horizontal') ? 'x' : 'y' ;

    if(scrollType === 'x'){
      scrollContent.css({ width: ((width * childs.length)) + 'px' });
    }else{
      scrollContent.css({ height: ((height * childs.length)) + 'px' });
    }
  }

  return {
    init: initialize,
    sanitize: sanitize,
    refresh: refresh
  }
}(jQuery));


// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

var App = (function(){
  var activePage = 'thenews';

  function initialize(section){
    // Initialize Generic stuff
    bootstrapStart();

    if( section ){
     activePage = section;
    }

    getpage(activePage);
  }

  function bootstrapStart () {
    // alert(window.screen.availWidth + ' / ' + window.screen.availHeight);
    $('ul#main-navigation a').on({
      click: function ( e ) {
        e.preventDefault();

        getpage($(this).attr('href'));
      }
    });

    $('#mhwire a').on({
      click: function ( e ) { 
        e.preventDefault();
      }
    });

    $(window).on({
      orientationchange: function ( e ) {
        console.log('orientationchange');
        updateViewport(activePage);
        setTimeout(function(){
          SiteScrollers.init(activePage,{
            momentum: true,
            hScrollbar: false,
            vScrollbar: false
          });
        },0);
      },
      keypress: function ( e ) {
        if(e.which === 114){
          $(this).trigger('orientationchange');
        }
      }
    });
  }

  function updateViewport ( n ) {
    if(n === 'loading-screen'){
      $('.app').hide();

      $('.app-page-fixed').css({
        height: ( $('html')[0].clientHeight ) + 'px'
      });
    }

    if(n === 'mhwire' || n === 'mybriefcase'){
      $('.app-page-fixed').css({
        height: ( $('html')[0].clientHeight - 95 ) + 'px'
      });
    }
  }

  function getpage ( n, callback ) {
    activePage = n;

    $('.splash, .loading, .thenews, .mybriefcase, .mytopics, .mhwire').hide();
    $('.app').show();

    updateViewport(n);

    $('.'+n).show();

    // Page Scroll Initialization
    SiteScrollers.init(n,{
      momentum: true,
      hScrollbar: false,
      vScrollbar: false
    });
  }

  return {
    init: initialize
  }
}());

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

$(function(){
  App.init('thenews');
  SiteScrollers.refresh();
});