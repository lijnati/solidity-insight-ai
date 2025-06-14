
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user } = useSupabaseAuth();
  const location = useLocation();

  return (
    <header className="w-full bg-background border-b py-3 px-4 flex justify-between items-center shadow-sm">
      <Link to="/" className="text-xl font-bold tracking-tight text-primary">
        Solidity Audit Tool
      </Link>
      <div className="flex items-center gap-6">
        {user && (
          <Link
            to="/my-audits"
            className="flex items-center px-2 py-1 rounded hover:bg-accent transition"
          >
            My Audits
          </Link>
        )}
        {user ? (
          <>
            <Link to="/profile" className="flex items-center gap-2 hover:underline">
              <Avatar className="w-7 h-7">
                <AvatarImage src={undefined} />
                <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span>Profile</span>
            </Link>
          </>
        ) : (
          location.pathname !== "/auth" && (
            <Button asChild size="sm">
              <Link to="/auth">Log in</Link>
            </Button>
          )
        )}
      </div>
    </header>
  );
}
