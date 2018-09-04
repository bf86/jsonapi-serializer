const sendOnce = require('./send-once');
const {cloneDeep, get, isObject, set} = require('lodash');

module.exports = function(opts, req, res) {
  let {include} = req.query
  if (!include) {
    return opts;
  }
  let relationsToInclude = include.split(',');
  let originalOpts = cloneDeep(opts);
  removeIncludes(opts);
  restoreRequestedIncludes(opts);
  return opts;

  function removeIncludes(opts) {
    Object.values(opts).forEach(function(opt) {
      delete opt.attributes;
      if (opt && isObject(opt)) {
        removeIncludes(opt);
      }
    });
  }

  function restoreRequestedIncludes(opts) {
    relationsToInclude.forEach(function(relationToInclude) {
      let expandedRelations = expandNestedRelations(relationToInclude);
      expandedRelations.forEach(function(expandedRelationToInclude) {
        let originalAttributes = get(originalOpts, `${expandedRelationToInclude}.attributes`);
        if (!originalAttributes) {
          let detail = `Invalid include paramater ${relationToInclude}`;
          let obj = {errors: [{detail}]};
          sendOnce(res, 400, obj);
        }
        set(opts, `${expandedRelationToInclude}.attributes`, originalAttributes);
      });
    });
  }

  function expandNestedRelations(deepRelation) {
    let expandedRelations = [];
    let splitRelations = deepRelation.split('.');
    splitRelations.forEach(function(relation, index) {
      expandedRelations.push(splitRelations.slice(0, index + 1).join('.'));
    });
    return expandedRelations;
  }
};
