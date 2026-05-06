export type DemoLoginAccount = {
  label: string;
  email: string;
  password: string;
};

export const MT_JULIET_DEMO_ACCOUNTS: DemoLoginAccount[] = [
  {
    label: "Mt. Juliet Customer",
    email: "customer.mtjuliet@shoeinn.demo",
    password: "Password123!",
  },
  {
    label: "Mt. Juliet Provider",
    email: "provider.mtjuliet@shoeinn.demo",
    password: "Password123!",
  },
  {
    label: "Mt. Juliet Company Admin",
    email: "admin.mtjuliet@shoeinn.demo",
    password: "Password123!",
  },
];

function readFlagFromRuntime(): boolean {
  let extraFlag: boolean | string | undefined;
  try {
    const Constants = require("expo-constants").default as {
      expoConfig?: { extra?: { SHOW_DEMO_LOGINS?: boolean | string } };
    };
    extraFlag = Constants.expoConfig?.extra?.SHOW_DEMO_LOGINS;
  } catch {
    extraFlag = undefined;
  }
  if (typeof extraFlag === "boolean") {
    return extraFlag;
  }
  if (typeof extraFlag === "string") {
    return extraFlag.trim().toLowerCase() === "true";
  }
  return false;
}

export function shouldShowDemoLogins(flag = readFlagFromRuntime()): boolean {
  return flag;
}
