export const ADMIN_COOKIE_NAME = "equipment_admin_session";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.APP_ADMIN_PASSWORD || "";
}

export function createAdminSessionToken(password: string) {
  return password;
}
