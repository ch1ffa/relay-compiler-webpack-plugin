import { Schema } from "schema-utils/declarations/validate";

export const schema: Schema = {
  type: 'object',
  properties: {
    config: {
      type: 'string',
    },
    watch: {
      type: 'boolean',
    },
    validate: {
      type: 'boolean',
    },
    output: {
      'enum': ['debug', 'verbose', 'quiet', 'quietWithErrors']
    },
    repersist: {
      type: 'boolean'
    },
    artifactDirectory: {
      type: 'string'
    },
    schema: {
      type: 'string'
    },
    src: {
      type: 'string'
    },
  },
  'additionalProperties': false,
};
