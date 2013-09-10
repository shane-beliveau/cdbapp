define([], function(){

  return (function(){
    var canvas, image;

    function getParamFromQueryString (variable, queryString) {
      var query = queryString || location.hash.split('?')[1],
        vars = query.split('&'),
        i = 0;
      for (; i < vars.length; i++) {
          var pair = vars[i].split('=');
          if (decodeURIComponent(pair[0]) == variable) return decodeURIComponent(pair[1]);
      }
      console.log('Query variable %s not found', variable);
    }

    function getBase64Image(img) {
      var ctx, dataURL;

      canvas = (canvas) ? canvas : document.createElement('canvas');
      image = (image) ? image : document.createElement('img');

      image.src = img;

      canvas.width = image.width;
      canvas.height = image.height;

      ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      dataURL = canvas.toDataURL('image/png');

      // return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
      return (dataURL === 'data:,') ? false : dataURL;
    }

    return {
      getBase64Image: getBase64Image,
      getParamFromQueryString: getParamFromQueryString
    }
  }());

});