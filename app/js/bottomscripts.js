function resizeVideo() {
  $(".widescreenVideo").each(function() {
    if ($(this).parent().width() >= 300) {
      $(this).css("width", $(this).parent().width() - 183);
    } else {
      $(this).css("width", "100%");
    }
    $(this).css("height", (($(this).width() * 9) / 16) / 0.99);
  });
}