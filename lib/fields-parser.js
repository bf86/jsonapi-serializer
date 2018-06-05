var _ = require('lodash');
var {singularize, pluralize} = require('./inflector');

module.exports = function(collectionName, opts, req) {
  let {fields} = req.query;
  if (!fields) {
    return;
  }

  return pruneFields(opts, collectionName);

  function pruneFields(opts, primaryType) {
    for (let type in fields) {
      if (isSameType(type, primaryType)) {
        opts.attributes = fields[type].split(',');
        opts = pruneRelationships(opts, fields[type], type);
      }
      let includedOpts = findOptsForType(opts, type);
      if (includedOpts) {
        pruneFields(includedOpts, type);
      }
    }
    return opts;
  }

  function isSameType(typeA, typeB) {
    return typeA === typeB
      || typeA === pluralize(typeB)
      || typeA === singularize(typeB);
  }

  function findOptsForType(opts, type) {
    for (let opt in opts) {
      if (isSameType(opt, type)
        || isSameType(opts[opt].type, type)) {
        return opts[opt];
      }
    }
  }

  function pruneRelationships(optsToPrune, fields, type) {
    for (let opt in optsToPrune) {
      if (isRelationship(opt, optsToPrune)
        && !fields.includes(opt)
        && !fields.includes(optsToPrune[opt].type)) {
        delete optsToPrune[opt];
      }
    }
    return optsToPrune;
  }

  function isRelationship(opt, optsToPrune) {
    return _.isObject(optsToPrune[opt])
      && !nonRelationshipKeys.includes(opt)
      && optsToPrune[opt].hasOwnProperty('ref');
  }
};

const nonRelationshipKeys = [
  'attributes',
  'dataLinks',
  'keyForAttribute',
  'typeForAttribute',
  'transform'
];
