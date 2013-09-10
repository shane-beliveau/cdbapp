define([
  'backbone', 'underscore', 'moment'
],
  function (Backbone, _, Moment) {

    return Backbone.Model.extend({

      articleUrl: function(){
        return this.get('link');
      },

      defaults: {
        id:'',
        description: '',
        pubDate: '',
        encoded: false,
        picOrientation: '',
        link: '',
        article: '',
        groupid: null,
        processed: false,
        accessMsg: '',
        isMetered: false
      },

      subscriptionMap: {
        0 : 'Special Content',
        1 : 'Premium Content',
        32 : 'DMIH Content',
        64 : 'Free Registration-Required Content',
        128 : 'NXT Content',
        256 : 'College Content',
        512 : 'Metered Content'
      },

      initialize: function () {

      },

      fetchArticle: function(opts) {

        var model = this,
          _opts = opts,
          fetchOptions = _.extend({
            url: this.articleUrl(),
            success: function(model, response, options) {
              model.parseArticle(response);
            },
            error: function(model, xhr, options) {
              console.log('error while parsing the response');
            }
          }, opts);

        this.fetch(fetchOptions);
      },

      parseArticle: function (response) {
        this.set({
          groupid: response.nitf.head.docdata.groupID,
          isMetered: response.nitf.head.docdata.isMetered,
          article: {
            title: response.nitf.body.bodyHead.headline,
            author: response.nitf.body.bodyHead.byline,
            paragraphs: response.nitf.body.bodyContent.textParagraphs,
            image: response.nitf.body.bodyContent.image,
            shareUrl: response.nitf.head.docdata.shareurl,
            blogTitle: response.nitf.head.docdata.blogTitle,
            blogLanding: response.nitf.head.docdata.blogLanding
          },
          processed: true,
          accessMsg: this.getAccessMsg(response.nitf.head.docdata.groupID)
        });

        this.trigger('saveToLocalStorage');
      },

      contentToArray: function () {
        var model = this;
        return {
            id: model.get('id'),
            pubDate: moment(model.get('pubDate')).format('dddd, MMMM Do YYYY'),
            title: model.get('article').body.bodyHead.headline,
            author: model.get('article').body.bodyHead.byline,
            image: model.get('article').body.bodyContent.image,
            paragraphs: model.get('article').body.bodyContent.textParagraphs,
            shareUrl: model.get('article').head.docdata.shareurl,
            blogTitle: model.get('article').head.docdata.blogTitle,
            blogLanding: model.get('article').head.docdata.blogLanding,
            groupid: model.get('groupid'),
            isMetered: model.get('isMetered')
          };
      },

      getAccessMsg: function(groupid) {
        return this.subscriptionMap[groupid];
      }

    });

});