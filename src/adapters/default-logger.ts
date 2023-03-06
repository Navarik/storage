import { Logger } from "../types"

const format = (level: string, component: string, message: string) =>
  `[${new Date().toISOString()}] ${level} [${component}] ${message}`

export const defaultLogger: Logger = {
  fatal: ({ component }: { component: string }, message: string, ...rest) =>
    console.error(format("FATAL", component, message), rest),
  error: ({ component }: { component: string }, message: string, ...rest) =>
    console.error(format("ERROR", component, message), rest),
  warn: ({ component }: { component: string }, message: string, ...rest) =>
    console.warn(format("WARN", component, message), rest),
  info: ({ component }: { component: string }, message: string, ...rest) =>
    console.info(format("INFO", component, message), rest),
  debug: ({ component }: { component: string }, message: string, ...rest) =>
    console.debug(format("DEBUG", component, message), rest),
  trace: ({ component }: { component: string }, message: string, ...rest) =>
    console.debug(format("TRACE", component, message), rest),
}
