module.exports = {
  default: {
    paths: ["tests/bdd/features/**/*.feature"],
    require: ["tests/bdd/steps/**/*.ts"],
    format: ["summary", "progress"],
    publishQuiet: true
  }
};
