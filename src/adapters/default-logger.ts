import { Logger } from "@navarik/types";

export const defaultLogger: Logger = {
  fatal: (...args) => console.error(args),
  error: (...args) => console.error(args),
  warn: (...args) => console.warn(args),
  info: (...args) => console.info(args),
  debug: (...args) => console.debug(args),
  trace: (...args) => console.debug(args),
}
