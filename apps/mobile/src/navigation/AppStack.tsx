import React from "react";

import CompanyStack from "./CompanyStack";
import CustomerStack from "./CustomerStack";
import AdminStack from "./AdminStack";
import type { UserRole } from "../state/authStore";

interface Props {
  role: Exclude<UserRole, null>;
}

export default function AppStack({ role }: Props) {
  if (role === "admin") {
    return <AdminStack />;
  }
  if (role === "company" || role === "provider" || role === "company_admin") {
    return <CompanyStack />;
  }
  return <CustomerStack />;
}
