"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Accounts", href: "/dashboard/accounts" },
];

export default function NavTabs() {
  const pathname = usePathname();
  const current = TABS.reduce(
    (best, t, i) => (pathname === t.href || (t.href !== "/dashboard" && pathname.startsWith(t.href)) ? i : best),
    0,
  );

  return (
    <Tabs
      value={current}
      textColor="inherit"
      indicatorColor="secondary"
      variant="scrollable"
      scrollButtons="auto"
      aria-label="Dashboard sections"
    >
      {TABS.map((t) => (
        <Tab
          key={t.href}
          component={NextLink}
          href={t.href}
          label={t.label}
          sx={{ textTransform: "none", fontWeight: 600 }}
        />
      ))}
    </Tabs>
  );
}
