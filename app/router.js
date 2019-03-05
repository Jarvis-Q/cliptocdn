'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/view/clipboard', controller.home.clipboard);
  router.post('/view/clipboardUpload', controller.home.clipboardUpload);
};
