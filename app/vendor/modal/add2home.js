var add2home = {
  isiPad: navigator.userAgent.match(/iPad/i) != null,
  isSafari: navigator.userAgent.match(/Safari/i) != null,
  cookie: null,
  copy: '<h2>Setup Guide<a href="#">X</a></h2><p>Welcome to the <span>Crain\'s Detroit Business</span> News Reader web app.</p><p>To add the News Reader icon to your Home screen and get full offline access:</p><div class="shareContainer"><img src="images/share_button.png" /><div>Tap the <strong>Share button</strong> in Safari\'s menu bar</div></div><div class="addContainer"><img src="images/add2home_button.png" /><div>Tap the <strong>Add to home screen</strong> icon</div></div><div id="userAgent"></div>',
  init: function () {
    $("#iPadMessage").html(add2home.copy);
    $("#iPadMessage").easyModal();
    add2home.cookie = add2home.readCookie("iPadMessage");
    if (add2home.isiPad && add2home.isSafari) {
      if (add2home.cookie === null) {
        add2home.createCookie("iPadMessage", 1, 30);
        setTimeout(function() {
          $("#iPadMessage").trigger("openModal");
        }, 3000);
      } else {
        if (add2home.cookie < 3) {
          add2home.cookie++;
          add2home.createCookie("iPadMessage", add2home.cookie, 30);
          setTimeout(function() {
            $("#iPadMessage").trigger("openModal");
          }, 3000);        
        }
      }
      $("#iPadMessage a").click(function(e) {
        e.preventDefault();
        $("#iPadMessage").trigger('closeModal');
      });
    }
  },
  createCookie: function (name,value,days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";    
  },
  readCookie: function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;    
  }
}
$(document).ready(function() { add2home.init() });