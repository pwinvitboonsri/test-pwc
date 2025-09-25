/* eslint-disable @typescript-eslint/no-var-requires */
const { register } = require("ts-node");

register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs"
  }
});

require("./seed.ts");
