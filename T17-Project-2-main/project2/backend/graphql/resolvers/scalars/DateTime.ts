import { GraphQLScalarType, Kind } from "graphql";

// ISO-8601 DateTime scalar shared by the schema.
const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time string",
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    return value ? new Date(String(value)).toISOString() : null;
  },
  parseValue(value: unknown) {
    return value ? new Date(String(value)) : null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

export default DateTime;
