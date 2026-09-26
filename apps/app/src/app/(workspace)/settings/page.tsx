"use client";

import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

import { openBillingPortal } from "@typefolio/core/api";

import { SignOutButton } from "@/components/sign-out-button";
import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {control}
    </div>
  );
}

export default function SettingsPage() {
  const { entitlement } = useLibrary();
  const { theme, setTheme } = useTheme();
  const [autoSync, setAutoSync] = useState(true);
  const [mobileData, setMobileData] = useState(false);

  return (
    <div>
      <PageHeader title="Settings" description="Account, sync, and appearance." />
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Plan and session controls.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow
                title="Plan"
                description={entitlement ? `${entitlement.plan} · ${entitlement.status}` : "Loading"}
                control={
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const result = await openBillingPortal();
                        window.location.href = result.portalUrl;
                      } catch {
                        toast.error("Billing portal unavailable.");
                      }
                    }}
                  >
                    Manage
                  </Button>
                }
              />
              <SettingRow
                title="Session"
                description="Sign out of this browser."
                control={<SignOutButton />}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Sync</CardTitle>
              <CardDescription>Keep devices up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow
                title="Automatic sync"
                description="Keep your devices up to date."
                control={
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} aria-label="Automatic sync" />
                }
              />
              <SettingRow
                title="Sync over mobile data"
                description="Avoid large transfers on cellular."
                control={
                  <Switch
                    checked={mobileData}
                    onCheckedChange={setMobileData}
                    aria-label="Sync over mobile data"
                  />
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Light is the default for font specimens.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-6">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shortcuts">
          <Card>
            <CardHeader>
              <CardTitle>Keyboard shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["⌘K", "Search"],
                ["⌘/", "Command menu"],
                ["G then F", "Fonts"],
                ["G then C", "Collections"],
                ["G then D", "Devices"],
              ].map(([key, label]) => (
                <div key={key} className="flex justify-between">
                  <span>{label}</span>
                  <kbd className="text-muted-foreground">{key}</kbd>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
