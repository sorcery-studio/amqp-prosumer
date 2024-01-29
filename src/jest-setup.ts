import { Command } from "commander";
import CustomMatcherResult = jest.CustomMatcherResult;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      commandToHaveOption(name: string, value?: unknown): R;
    }
  }
}

expect.extend({
  commandToHaveOption: (
    received: Command,
    optName: string,
    optValue?: unknown,
  ): CustomMatcherResult => {
    const opts = received.opts();
    const optNames = Object.keys(opts);

    if (!optNames.includes(optName)) {
      return {
        pass: false,
        message: (): string =>
          `Expected that the command will have option ${optName}`,
      };
    }

    if (optValue !== undefined && opts[optName] !== optValue) {
      return {
        pass: false,
        message: (): string =>
          `Expected that the command option ${optName} will have value: ${optValue}, got ${opts[optName]} instead`,
      };
    }

    return {
      pass: true,
      message: (): string =>
        `The option ${optName} was not expected to be present!`,
    };
  },
});
