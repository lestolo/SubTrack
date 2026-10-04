/* Bump on every release: it also renames the offline cache in sw.js. */
(function (g) {
  'use strict';
  const ST = (g.ST = g.ST || {});
  ST.VERSION = '1.0.1';
  ST.REPO_URL = 'https://github.com/lestolo/subscription-tracker';
})(typeof self !== 'undefined' ? self : globalThis);
