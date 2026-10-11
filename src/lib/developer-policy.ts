export function developerEnabled(environment = process.env.NODE_ENV) { return environment === "development"; }
export function developerCredentials(username: unknown, password: unknown, environment = process.env.NODE_ENV) {
  return developerEnabled(environment) && username === "dev" && password === "password";
}