require.config({
     // Initialize the application with the main application file.
    deps: ["app"],
    paths: {
      backbone: '../vendor/backbone/backbone',
      underscore: '../vendor/underscore/underscore',
      moment: '../vendor/moment/moment',
      mustache: '../vendor/mustache/mustache',
      iscroll: '../vendor/iscroll/iscroll',
      iscrollHelper: '../vendor/iscroll/iscroll-helper',
      templates: '../templates',
      text: '../vendor/require/text',
      utils: '../vendor/utils'
    },
    shim: {
      'backbone': {
        deps: ['underscore'],
        exports: 'Backbone'
      },
      'underscore': {
        exports: '_'
      },
      'mustache': {
        exports: 'Mustache'
      },
      'iscroll': {
        exports: 'iScroll'
      }
    }
});