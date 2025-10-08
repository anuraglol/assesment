"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const Nav = () => {
  const path = usePathname();

  return (
    <header className="flex text-lg gap-6 top-8 absolute items-center w-full justify-center">
      <Link
        href="/"
        className={`hover:underline underline-offset-4 ${path === "/" ? "underline" : ""}`}
      >
        Cosmos
      </Link>
      <Link
        href="/pay"
        className={`hover:underline underline-offset-4 ${path === "/pay" ? "underline" : ""}`}
      >
        Payment
      </Link>
    </header>
  );
};
