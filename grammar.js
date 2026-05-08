const PREC = {
  sequence: 1,
  disjunction: 2,
  iff: 3,
  implication: 4,
  conjunction: 5,
  temporal_binary: 6,
  comparison: 8,
  multiplicity_unary: 9,
  quantifier: 10,
  union: 10,
  cardinality: 11,
  override: 12,
  intersection: 13,
  arrow: 14,
  restriction: 15,
  box: 16,
  join: 17,
  prime: 18,
  unary: 19,
  logical_unary: 7,
};

module.exports = grammar({
  name: "alloy6",

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      optional($.module_declaration),
      repeat($.open_declaration),
      repeat($._paragraph),
    ),

    module_declaration: $ => seq(
      "module",
      field("name", $.qualified_name),
      optional($.module_parameters),
    ),

    module_parameters: $ => seq(
      "[",
      commaSep1($.identifier),
      "]",
    ),

    open_declaration: $ => seq(
      "open",
      field("name", $.qualified_name),
      optional($.open_arguments),
      optional(seq("as", field("alias", $.identifier))),
    ),

    open_arguments: $ => seq(
      "[",
      commaSep1($.qualified_name),
      "]",
    ),

    _paragraph: $ => choice(
      $.signature_declaration,
      $.fact_declaration,
      $.predicate_declaration,
      $.function_declaration,
      $.assertion_declaration,
      $.command_declaration,
      $.enum_declaration,
    ),

    signature_declaration: $ => seq(
      optional("var"),
      optional("abstract"),
      optional($.multiplicity),
      "sig",
      field("names", $.name_list),
      optional($.signature_extension),
      "{",
      optional(commaSep($.field_declaration)),
      optional(","),
      "}",
      optional($.block),
    ),

    signature_extension: $ => choice(
      seq("extends", field("type", $.qualified_name)),
      seq("in", field("types", sep1($.qualified_name, "+"))),
    ),

    field_declaration: $ => seq(
      optional("var"),
      $.declaration,
    ),

    fact_declaration: $ => seq(
      "fact",
      optional(field("name", $.identifier)),
      $.block,
    ),

    predicate_declaration: $ => seq(
      "pred",
      optional($.receiver),
      field("name", $.identifier),
      optional($.parameter_declarations),
      $.block,
    ),

    function_declaration: $ => seq(
      "fun",
      optional($.receiver),
      field("name", $.identifier),
      optional($.parameter_declarations),
      ":",
      field("return_type", $.expression),
      field("body", $.braced_expression),
    ),

    receiver: $ => seq(
      $.qualified_name,
      ".",
    ),

    parameter_declarations: $ => choice(
      seq("(", optional(commaSep($.declaration)), ")"),
      seq("[", optional(commaSep($.declaration)), "]"),
    ),

    assertion_declaration: $ => seq(
      "assert",
      optional(field("name", $.identifier)),
      $.block,
    ),

    enum_declaration: $ => seq(
      "enum",
      field("name", $.identifier),
      "{",
      commaSep1($.identifier),
      "}",
    ),

    command_declaration: $ => seq(
      optional(seq(field("name", $.identifier), ":")),
      choice("run", "check"),
      field("target", choice(
        seq($.qualified_name, optional($.block)),
        $.block,
      )),
      optional($.scope),
      optional(seq("expect", $.number)),
    ),

    scope: $ => choice(
      seq("for", $.number, optional(seq("but", commaSep1($.scope_item)))),
      seq("for", commaSep1($.scope_item)),
    ),

    scope_item: $ => choice(
      $.type_scope,
      $.step_scope,
    ),

    type_scope: $ => seq(
      optional("exactly"),
      $.number,
      $.qualified_name,
    ),

    step_scope: $ => seq(
      $.number,
      optional(seq("..", optional($.number))),
      "steps",
    ),

    declaration: $ => seq(
      optional("disj"),
      $.name_list,
      ":",
      optional("disj"),
      $.expression,
    ),

    name_list: $ => commaSep1($.identifier),

    block: $ => seq(
      "{",
      repeat($.expression),
      "}",
    ),

    braced_expression: $ => seq(
      "{",
      $.expression,
      "}",
    ),

    block_or_bar: $ => choice(
      $.block,
      seq("|", $.expression),
    ),

    expression: $ => choice(
      $.primary_expression,
      $.let_expression,
      $.quantified_expression,
      $.set_comprehension,
      $.unary_expression,
      $.binary_expression,
      $.implicit_conjunction_expression,
      $.comparison_expression,
      $.implication_expression,
      $.box_expression,
      $.prime_expression,
      $.arrow_expression,
    ),

    primary_expression: $ => choice(
      $.constant,
      $.qualified_name,
      $.at_name,
      "this",
      seq("(", $.expression, ")"),
      $.block,
    ),

    constant: $ => choice(
      $.number,
      seq("-", $.number),
      "none",
      "univ",
      "iden",
    ),

    at_name: $ => seq(
      "@",
      $.identifier,
    ),

    unary_expression: $ => choice(
      prec(PREC.unary, seq(
        field("operator", $.relational_unary_operator),
        field("argument", $.expression),
      )),
      prec(PREC.cardinality, seq(
        field("operator", "#"),
        field("argument", $.expression),
      )),
      prec(PREC.multiplicity_unary, seq(
        field("operator", $.multiplicity_unary_operator),
        field("argument", $.expression),
      )),
      prec(PREC.logical_unary, seq(
        field("operator", $.logical_unary_operator),
        field("argument", $.expression),
      )),
    ),

    relational_unary_operator: _ => choice(
      "~",
      "*",
      "^",
    ),

    multiplicity_unary_operator: _ => choice(
      "no",
      "some",
      "lone",
      "one",
      "set",
      "int",
    ),

    logical_unary_operator: _ => choice(
      "!",
      "not",
      "always",
      "eventually",
      "after",
      "before",
      "historically",
      "once",
    ),

    binary_expression: $ => choice(
      $._sequence_expression,
      $._temporal_binary_expression,
      $._non_temporal_binary_expression,
    ),

    _sequence_expression: $ =>
      prec.right(PREC.sequence, seq($.expression, field("operator", ";"), $.expression)),

    _temporal_binary_expression: $ => prec(PREC.temporal_binary, seq(
      $._temporal_binary_operand,
      field("operator", choice("until", "releases", "since", "triggered")),
      $._temporal_binary_operand,
    )),

    _temporal_binary_operand: $ => choice(
      $.primary_expression,
      $.let_expression,
      $.quantified_expression,
      $.set_comprehension,
      $.unary_expression,
      $._non_temporal_binary_expression,
      $.implicit_conjunction_expression,
      $.comparison_expression,
      $.implication_expression,
      $.box_expression,
      $.prime_expression,
      $.arrow_expression,
    ),

    _non_temporal_binary_expression: $ => choice(
      prec.left(PREC.disjunction, seq($.expression, field("operator", choice("||", "or")), $.expression)),
      prec.left(PREC.iff, seq($.expression, field("operator", choice("<=>", "iff")), $.expression)),
      prec.left(PREC.conjunction, seq($.expression, field("operator", choice("&&", "and")), $.expression)),
      prec.left(PREC.union, seq($.expression, field("operator", choice("+", "-")), $.expression)),
      prec.left(PREC.override, seq($.expression, field("operator", "++"), $.expression)),
      prec.left(PREC.intersection, seq($.expression, field("operator", "&"), $.expression)),
      prec.left(PREC.restriction, seq($.expression, field("operator", choice("<:", ":>")), $.expression)),
      prec.left(PREC.join, seq($.expression, field("operator", "."), $.expression)),
    ),

    implicit_conjunction_expression: $ => choice(
      prec.left(PREC.conjunction, seq($.expression, $.quantified_expression)),
      prec.left(PREC.conjunction, seq($.expression, $.unary_expression)),
    ),

    implication_expression: $ => prec.right(PREC.implication, seq(
      field("condition", $.expression),
      field("operator", choice("=>", "implies")),
      field("consequence", $.expression),
      optional(seq("else", field("alternative", $.expression))),
    )),

    comparison_expression: $ => prec.left(PREC.comparison, seq(
      $.expression,
      optional(choice("!", "not")),
      field("operator", $.comparison_operator),
      $.expression,
    )),

    comparison_operator: _ => choice(
      "in",
      "=",
      "<",
      ">",
      "=<",
      ">=",
    ),

    arrow_expression: $ => prec.left(PREC.arrow, seq(
      $.expression,
      $.arrow_operator,
      $.expression,
    )),

    arrow_operator: $ => seq(
      optional(choice($.multiplicity, "set")),
      "->",
      optional(choice($.multiplicity, "set")),
    ),

    box_expression: $ => prec.left(PREC.box, seq(
      $.expression,
      "[",
      optional(commaSep($.expression)),
      "]",
    )),

    prime_expression: $ => prec.left(PREC.prime, seq(
      $.expression,
      "'",
    )),

    let_expression: $ => prec.right(PREC.quantifier, seq(
      "let",
      commaSep1($.let_declaration),
      $.block_or_bar,
    )),

    let_declaration: $ => seq(
      $.identifier,
      "=",
      $.expression,
    ),

    quantified_expression: $ => prec.dynamic(1, prec.right(PREC.quantifier, seq(
      $.quantifier,
      commaSep1($.declaration),
      $.block_or_bar,
    ))),

    set_comprehension: $ => seq(
      "{",
      commaSep1($.declaration),
      $.block_or_bar,
      "}",
    ),

    quantifier: _ => choice(
      "all",
      "no",
      "sum",
      "some",
      "lone",
      "one",
    ),

    multiplicity: _ => choice(
      "one",
      "lone",
      "some",
    ),

    qualified_name: $ => seq(
      optional("this/"),
      repeat(seq($.identifier, "/")),
      $.identifier,
    ),

    number: _ => token(choice(
      "0",
      /[1-9][0-9]*/,
    )),

    identifier: _ => /[a-zA-Z][a-zA-Z0-9_"]*/,

    comment: _ => token(choice(
      seq(choice("//", "--"), /[^\n\r]*/),
      seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
    )),
  },

  conflicts: $ => [
    [$.multiplicity_unary_operator, $.quantifier],
    [$.unary_expression, $.implicit_conjunction_expression, $.arrow_expression],
    [$._non_temporal_binary_expression, $.implicit_conjunction_expression, $.arrow_expression],
    [$.comparison_expression, $.implicit_conjunction_expression, $.arrow_expression],
    [$.unary_expression, $.implicit_conjunction_expression, $.comparison_expression],
    [$.arrow_operator],
    [$.scope, $.type_scope],
    [$.expression, $._temporal_binary_operand],
    [$.binary_expression, $._temporal_binary_operand],
    [$._temporal_binary_expression],
  ],
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return sep1(rule, ",");
}

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
