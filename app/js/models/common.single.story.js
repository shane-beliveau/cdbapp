define([
  'backbone', 'underscore', 'moment'
],
  function (Backbone, _, Moment) {

    return Backbone.Model.extend({

      articleUrl: function(){
        // return 'services/articleOne.json';
        return this.get('link');
      },

      defaults: {
        id:'',
        title:'',
        description: '',
        pubDate: '',
        image: '',
        encoded: false,
        picOrientation: '',
        link: '',
        article: ''
      },

      initialize: function () {

      },

      fetchArticle: function (opts) {
        var model = this,
          fetchOptions = _.extend({
            url: this.articleUrl(),
            success: function (model, response, options) {
              model.parseArticle(response);
            },
            error: function (model, xhr, options) {
              console.log('error while parsing the response');
            }
          }, opts);

        this.fetch(fetchOptions);
      },

      parseArticle: function (response) {
        this.set({
          article: {
            author: response.nitf.body.bodyHead.byline,
            paragraphs: response.nitf.body.bodyContent.textParagraphs,
            shareUrl: response.nitf.head.docdata.shareurl
          }
        });

        this.trigger('saveToLocalStorage');
      },

      contentToArray: function () {
        var model = this;
        return {
            id: model.get('id'),
            pubDate: moment(model.get('pubDate')).format('dddd, MMMM Do YYYY'),
            title: model.get('title'),
            author: model.get('article').body.bodyHead.byline,
            paragraphs: model.get('article').body.bodyContent.textParagraphs,
            shareUrl: model.get('shareUrl')
          };
      }

    });

});