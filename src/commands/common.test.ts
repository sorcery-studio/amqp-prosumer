/* eslint-disable no-console */
import { reportErrorAndExit } from "./common";

describe("Common", () => {
  describe("Reporting Error", () => {
    test("it logs the error on console and exits", () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      process.exit = jest.fn();
      console.error = jest.fn();

      const err = new Error("Example Error");

      reportErrorAndExit(err);

      expect(console.error).toBeCalledWith("ERROR:", err.message);
      expect(process.exit).toBeCalled();
    });
  });
});
