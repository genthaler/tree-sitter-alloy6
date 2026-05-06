module.exports = grammar({
  name: "alloy6",

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.sig_definition,
      // TODO: facts, open, functions, pred, assert and commands
    ),

    sig_definition: $ => seq(
      optional($.var),
      optional($.abstract),
      optional($.multiplicity),
      "sig",
      field("names", $.name_list),
      optional(choice($.sig_extends, $.sig_in)),
      "{",
      field("fields", optional($.field_list)),
      "}",
      optional($.block),
    ),

    abstract: _ => "abstract",
    var: _ => "var",

    name_list: $ => $._name_list,
    _name_list: $ => choice(
      $.identifier,
      seq($.identifier, ",", $._name_list),
    ),

    sig_extends: $ => seq(
      "extends",
      field("extends", $.qualified_name),
    ),

    sig_in: $ => seq(
      "in",
      field("in_list", $.sig_in_list),
    ),

    sig_in_list: $ => seq(
      $.qualified_name,
      optional(repeat(seq("+", $.qualified_name))),
    ),

    field_list: $ => $._field_list,
    _field_list: $ => seq(
      choice(
        $.field_declaration,
        seq($.field_declaration, ",", $._field_list),
      ),
      optional(","),
    ),

    field_declaration: $ => seq(
      optional($.var),
      optional("disj"),
      $.name_list,
      ":",
      optional("disj"),
      $.expression,
    ),

    expression: $ => choice(
      $.constant,
      // TODO: All the rest
    ),

    constant: _ => choice(
      choice(
        seq("-", /[0-9]+/),
        /-[0-9]+/,
      ),
      "none",
      "univ",
      "iden",
    ),

    multiplicity: _ => choice(
      "one",
      "lone",
      "some"
    ),

    qualified_name: $ => seq(
      // TODO: qualification
      $.identifier,
    ),

    block: $ => seq(
      "{",
      repeat($.expression),
      "}",
    ),

    identifier: _ => /[a-zA-Z][a-zA-Z0-9_"]*/,
  },

  conflicts: $ => [[$._field_list]],
});
