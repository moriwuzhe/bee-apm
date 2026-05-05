// 权限检查工具

/**
 * 检查当前用户是否有指定权限
 * @param permissions - 用户拥有的权限列表
 * @param required - 所需的权限（单个或多个）
 * @param mode - 检查模式（any 表示任一即可，all 表示必须全部满足）
 */
export function hasPermission(
  permissions: string[],
  required: string | string[],
  mode: "any" | "all" = "any"
): boolean {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  
  const requiredList = Array.isArray(required) ? required : [required];
  
  if (mode === "any") {
    return requiredList.some((p) => permissions.includes(p));
  }
  
  return requiredList.every((p) => permissions.includes(p));
}

/**
 * 检查当前用户是否有指定模块的权限
 * @param permissions - 用户拥有的权限列表
 * @param module - 模块名称（如 "project"、"app"、"alert"）
 */
export function hasModulePermission(permissions: string[], module: string): boolean {
  return permissions.some((p) => p.startsWith(`${module}:`));
}

/**
 * 检查权限是否匹配前缀
 * @param permissions - 用户拥有的权限列表
 * @param prefix - 权限前缀（如 "project:"、"app:"）
 */
export function hasPermissionPrefix(permissions: string[], prefix: string): boolean {
  return permissions.some((p) => p.startsWith(prefix));
}

/**
 * 获取用户在指定模块下的所有权限
 * @param permissions - 用户拥有的权限列表
 * @param module - 模块名称
 */
export function getModulePermissions(permissions: string[], module: string): string[] {
  return permissions.filter((p) => p.startsWith(`${module}:`));
}
