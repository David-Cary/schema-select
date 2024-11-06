# Schema Select
This library provides a framework for setting the schema of selected value, applying the effects of said schema to that value, and checking which schema if any already applies.  This is intended as a generic library for value editors where you want the users to be able to select a particular value type and have it applied.

# Quickstart
## Installation
You can install this library through npm like so:
```
$ npm install --save schema-select
```

## Option Factories
The meat of this library is the `SchemaOptionsFactory` class.  It's composed of three major elements: a label factory, an enforcer factory, and an optional schema splitter.  These are used in turn by the options factory's `process` function to extract a list of labeled schema enforcers.  Here's a run down of how that works:
  * The splitter breaks the schema down into a list of potential subschema branches.  This allows handling schema with multiple valid variants, such as a JSON schema using the "anyOf" keyword.
  * The label factory generates a label string for each of those subschemas.
  * The enforcer factory generatea a `SchemaEnforcer` for each subschema.

These combine to produce an array of `LabeledValue` items, each having a label string and a schema enforcer value.  Said schema enforcers have a reference to the associated subschema and a validate function.  They may also have an optional coerce function.

The validate function evaluates it's first parameter and returns a validation response based on whether the value matches the subschema.  The form this response takes varies by enforcer type, defaulting to a boolean.

Similarly, the coerce function return a value the meets the schema's criteria, adhering as closely as possible to the first parameter without violating the schema's constraints.

## JSON Schema Options
For an example of how this all comes together, see the `JSONSchemaOptionsFactory`.  That support JSON Schema values and comes prebuilt with all 3 subelements.  As such you can use it right out of the box like so:

```
import { JSONSchemaOptionsFactory } from "schema-select"

const optionsFactory = new JSONSchemaOptionsFactory()
const options = optionsFactory.process(true)
```

Doing so will give you a list of options for the array, object, boolean, string, number, integer, and null types.  It return those options rather than a single any type due to using a `JSONSchemaSplitter`, which assumes by default that users will want to be able to force a particular valid subtype.

Note that default enforcer factory is a minimalist one that currently only supports the type and const keywords, with enums handled by the splitter.  However, you can expand on or replace that enforcer as needed.

### Replacing the Enforcer Factor
When creating the JSON schema factory, you can pass in a custom enforcer factory as the first parameter.  Said factory must have the following type of `process` function:
```
(value: FlagOrObject) => SchemaEnforcer<FlagOrObject, ErrorLog<Partial<KeywordError>>>
```

That means the process function must accept a boolean or object as it's first parameter and return a schema enforcer as it's result.  Said enforcer must have a schema and validate property and may have a coerce function as noted above.  That validate function must return an object with an `errors` array.  The errors in that array may have the following properties:
  * keyword - name of the keyword rule violated
  * value - value associated with the above keyword in the source schema
  * target - value that failed validation
  * priority - importance of this error relative to any others
  * coerce - callback to generate a version of the provided value that would pass validation

This means you can plug your favorite JSON schema validation libary into a JSONSchemaOptionsFactory, provided you wrap it in an enforcer factory that follows the above rules.

Should you want to plug those into such a factory without those restrictions, simply create a `SchemaOptionsFactory` and pass in your custom enforcer factory like so:
```
import { SchemaOptionsFactory, JSONSchemaLabeler, JSONSchemaSplitter } from "schema-select"

const optionsFactory = new SchemaOptionsFactory(
  {
    process: (schema: any) => {
      return {
        schema,
        validate: (value: any) => Boolean(value)
      }
    }
  },
  new JSONSchemaLabeler(),
  new JSONSchemaSplitter()
)
```
Just plug your libary of choice into the above process callback and you're good to go.

### Adding Keyword Rules
You can add an additional keyword to schema parsing by adding a rule to the enforcer factory's keyword handler, like so:
```
const enforcerFactory = optionsFactory.enforcerFactory as JSONSchemaEnforcerFactory
enforcerFactory.keywordHandler.rules.push(
  {
    keyword: 'not',
    getEnforcerFor: (source: Record<string, any>) => {
      if ('not' in source) {
        const enforcer = enforcerFactory.process(source.not)
        return {
          schema: source,
          validate: (value) => {
            const result = enforcer.validate(value)
            return result.errors.length <= 0
              ? {
                errors: [
                  {
                    keyword: 'not',
                    value: source.not,
                    target: value
                  }
                ]
              }
              : { errors: [] }
          }
        }
      }
    }
  }
)
```
