"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getOAuthErrorMessage } from "@/lib/oauth/errors";

export function OAuthErrorToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    const message = getOAuthErrorMessage(error);
    if (message) toast.error(message);
  }, [error]);

  return null;
}
