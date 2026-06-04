export type DemoLoginAccount = {
  label: string;
  email: string;
  password: string;
};

export type DemoMarket = "shelby" | "mt_juliet";

export type DemoMarketDiscoveryLocation = {
  label: string;
  city: string | null;
  state: string;
};

export const SHELBY_DEMO_ACCOUNTS: DemoLoginAccount[] = [
  {
    label: "Shelby Customer",
    email: "customer@shoeinn.com",
    password: "Password1!",
  },
  {
    label: "Shelby Provider",
    email: "pelham.driver1@shoeinn.com",
    password: "Password1!",
  },
  {
    label: "Shelby Company Admin",
    email: "pelham.admin@shoeinn.com",
    password: "Password1!",
  },
];

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

export const DEMO_ACCOUNTS_BY_MARKET: Record<DemoMarket, DemoLoginAccount[]> = {
  shelby: SHELBY_DEMO_ACCOUNTS,
  mt_juliet: MT_JULIET_DEMO_ACCOUNTS,
};

export const DEMO_MARKET_LABELS: Record<DemoMarket, string> = {
  shelby: "Shelby County",
  mt_juliet: "Mt. Juliet",
};

export const DEMO_MARKET_DISCOVERY_LOCATIONS: Record<DemoMarket, DemoMarketDiscoveryLocation> = {
  shelby: {
    label: "Shelby County, AL",
    city: null,
    state: "AL",
  },
  mt_juliet: {
    label: "Mt. Juliet, TN",
    city: "Mt. Juliet",
    state: "TN",
  },
};

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

function normalizeDemoMarket(value: unknown): DemoMarket {
  if (typeof value !== "string") {
    return "shelby";
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "mt_juliet" ? "mt_juliet" : "shelby";
}

function readDemoMarketFromRuntime(): DemoMarket {
  let extraMarket: string | undefined;
  try {
    const Constants = require("expo-constants").default as {
      expoConfig?: { extra?: { DEMO_MARKET?: string } };
    };
    extraMarket = Constants.expoConfig?.extra?.DEMO_MARKET;
  } catch {
    extraMarket = undefined;
  }
  // eslint-disable-next-line no-process-env
  return normalizeDemoMarket(extraMarket ?? process.env.EXPO_PUBLIC_DEMO_MARKET);
}

export function getDemoMarket(market = readDemoMarketFromRuntime()): DemoMarket {
  return normalizeDemoMarket(market);
}

export function getDemoMarketLabel(market = getDemoMarket()): string {
  return DEMO_MARKET_LABELS[getDemoMarket(market)];
}

export function getDemoMarketDiscoveryLocation(market = getDemoMarket()): DemoMarketDiscoveryLocation {
  return DEMO_MARKET_DISCOVERY_LOCATIONS[getDemoMarket(market)];
}

export function getDemoLoginAccounts(market = getDemoMarket()): DemoLoginAccount[] {
  return DEMO_ACCOUNTS_BY_MARKET[getDemoMarket(market)];
}
