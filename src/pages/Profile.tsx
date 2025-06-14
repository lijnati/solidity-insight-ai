
import React, { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, loading, signOut } = useSupabaseAuth();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string }>({ username: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile({ username: data.username || "", avatar_url: data.avatar_url || "" });
        });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: profile.username, avatar_url: profile.avatar_url })
      .eq("id", user?.id);
    if (error) toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated", variant: "default" });
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-lg p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="font-semibold">
            Username
            <Input
              type="text"
              value={profile.username}
              onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
              disabled={saving}
              placeholder="Enter username"
            />
          </label>
          <label className="font-semibold">
            Avatar URL
            <Input
              type="url"
              value={profile.avatar_url}
              onChange={e => setProfile(p => ({ ...p, avatar_url: e.target.value }))}
              disabled={saving}
              placeholder="https://..."
            />
          </label>
          <Button type="submit" className="w-full" disabled={saving}>Save</Button>
        </form>
        {profile.avatar_url && (
          <div className="mt-4 flex justify-center">
            <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full border" />
          </div>
        )}
        <Button variant="destructive" className="w-full mt-8" onClick={handleLogout}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
