/* eslint-disable no-console */
import { reportErrorAndExit, EXIT_ERROR_CODE } from "./common";

describe("Common", () => {
  describe("Reporting Error", () => {
    test("it logs the error on console and exits", () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const exitSpy = jest.spyOn(process, "exit");
      exitSpy.mockImplementation(undefined);

      const consoleSpy = jest.spyOn(console, "error");
      consoleSpy.mockImplementation(undefined);

      const err = new Error("Example Error");

      reportErrorAndExit(err);

      expect(consoleSpy).toBeCalledWith("ERROR:", err.message, err.stack);
      expect(exitSpy).toBeCalledWith(EXIT_ERROR_CODE);
    });
  });
});
