const PREC = {
  sequence: 1,
  disjunction: 2,
  iff: 3,
  implication: 4,
  conjunction: 5,
  temporal_binary: 6,
  comparison: 7,
  quantifier: 8,
  union: 9,
  cardinality: 10,
  override: 11,
  intersection: 12,
  arrow: 13,
  restriction: 14,
  box: 15,
  join: 16,
  prime: 17,
  unary: 18,
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

    command_declaration: $ => seq(
      optional(seq(field("name", $.identifier), ":")),
      choice("run", "check"),
      field("target", choice($.qualified_name, $.block)),
      optional($.scope),
    ),

    scope: $ => choice(
      seq("for", $.number, optional(seq("but", commaSep1($.type_scope)))),
      seq("for", commaSep1($.type_scope)),
    ),

    type_scope: $ => seq(
      optional("exactly"),
      $.number,
      $.qualified_name,
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
      $.unary_expression,
      $.binary_expression,
      $.comparison_expression,
      $.implication_expression,
      $.let_expression,
      $.quantified_expression,
      $.set_comprehension,
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

    unary_expression: $ => prec(PREC.unary, seq(
      field("operator", $.unary_operator),
      field("argument", $.expression),
    )),

    unary_operator: _ => choice(
      "!",
      "not",
      "no",
      "some",
      "lone",
      "one",
      "set",
      "#",
      "~",
      "*",
      "^",
      "always",
      "eventually",
      "after",
      "before",
      "historically",
      "once",
    ),

    binary_expression: $ => choice(
      prec.left(PREC.sequence, seq($.expression, field("operator", ";"), $.expression)),
      prec.left(PREC.disjunction, seq($.expression, field("operator", choice("||", "or")), $.expression)),
      prec.left(PREC.iff, seq($.expression, field("operator", choice("<=>", "iff")), $.expression)),
      prec.left(PREC.conjunction, seq($.expression, field("operator", choice("&&", "and")), $.expression)),
      prec.left(PREC.temporal_binary, seq($.expression, field("operator", choice("until", "releases", "since", "triggered")), $.expression)),
      prec.left(PREC.union, seq($.expression, field("operator", choice("+", "-")), $.expression)),
      prec.left(PREC.override, seq($.expression, field("operator", "++"), $.expression)),
      prec.left(PREC.intersection, seq($.expression, field("operator", "&"), $.expression)),
      prec.left(PREC.restriction, seq($.expression, field("operator", choice("<:", ":>")), $.expression)),
      prec.left(PREC.join, seq($.expression, field("operator", "."), $.expression)),
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

    quantified_expression: $ => prec.right(PREC.quantifier, seq(
      $.quantifier,
      commaSep1($.declaration),
      $.block_or_bar,
    )),

    set_comprehension: $ => seq(
      "{",
      commaSep1($.declaration),
      $.block_or_bar,
      "}",
    ),

    quantifier: $ => choice(
      "all",
      "no",
      "sum",
      $.multiplicity,
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
    [$.unary_operator, $.quantifier],
    [$.unary_operator, $.multiplicity],
    [$.arrow_operator],
    [$.scope, $.type_scope],
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
