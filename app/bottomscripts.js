$('.menu-icon').click(function() {
  if ($("#smartphone-nav").is(":hidden")) {
    $("#smartphone-nav").slideDown();
  } else {
    $("#smartphone-nav").hide();
  }
});

$('#smartphone-nav a').click(function() {
  $('#smartphone-nav').slideUp();
});

$('#subscribe-toggle-nav').click(function() {
  if ($("#subscription").is(":hidden")) {
    $("#subscription").slideDown(function(){

      if( !$(this).hasClass('has-scroller') )
      {
        $('#subscription > div.scroller').css({
          height: $('#subscription:visible').outerHeight(true) + 'px'
        });

        $('#subscription').css({
          height: ($('html')[0].clientHeight - 100) + 'px'
        });

        var subScroll = new iScroll($('#subscription')[0],{
          momentum: true,
          hScrollbar: false,
          vScrollbar: false,
          hScroll: false
        });

        $(this).addClass('has-scroller');
      }
      
    
    });
  } else {
    $("#subscription").hide();
  }
});