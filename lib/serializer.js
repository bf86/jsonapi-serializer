'use strict';
var isFunction = require('lodash/isFunction');
var fieldsParser = require('./fields-parser');
var _mapValues = require('lodash/mapValues');
var SerializerUtils = require('./serializer-utils');
var _ = require('lodash');

module.exports = function(collectionName, records, opts) {
  this.serialize = function(records, req) {
    var that = this;
    var payload = {};

    if (req) {
      var parsedOpts = fieldsParser(that.collectionName, _.cloneDeep(that.originalOpts), req);
    }
    that.opts = parsedOpts || that.originalOpts;

    function getLinks(links) {
      return _mapValues(links, function(value) {
        if (isFunction(value)) {
          return value(records);
        } else {
          return value;
        }
      });
    }

    function collection() {
      payload.data = [];

      records.forEach(function(record) {
        var serializerUtils = new SerializerUtils(that.collectionName, record,
          payload, that.opts);
        payload.data.push(serializerUtils.perform());
      });

      return payload;
    }

    function resource() {
      payload.data = new SerializerUtils(that.collectionName, records, payload,
        that.opts).perform(records);

      return payload;
    }

    if (that.opts.topLevelLinks) {
      payload.links = getLinks(that.opts.topLevelLinks);
    }

    if (that.opts.meta) {
      payload.meta = _mapValues(that.opts.meta, function(value) {
        if (isFunction(value)) {
          return value(records);
        } else {
          return value;
        }
      });
    }

    if (Array.isArray(records)) {
      return collection(records);
    } else {
      return resource(records);
    }
  };

  if (arguments.length === 3) {
    // legacy behavior
    this.collectionName = collectionName;
    this.opts = opts;
    this.originalOpts = _.cloneDeep(this.opts);
    this.allFields = this.opts.attributes;
    return this.serialize(records);
  } else {
    // treat as a reusable serializer
    this.collectionName = collectionName;
    this.opts = records;
    this.originalOpts = _.cloneDeep(this.opts);
    this.allFields = this.opts.attributes;
  }
};
