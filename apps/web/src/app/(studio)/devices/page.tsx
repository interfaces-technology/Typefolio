import { DeviceList } from "@/components/device-list";
import { getDevices, getMe } from "@/lib/api-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const me = await getMe();
  if (!me) {
    redirect("/auth/sign-in?next=/devices");
  }

  const devices = await getDevices(me.library.id);

  return (
    <main className="flex flex-1 flex-col gap-8">
      <header className="max-w-prose space-y-2">
        <h1 className="text-[1.75rem] font-semibold">Devices</h1>
        <p className="text-muted-foreground">
          Mac and iPad apps that have signed into this library.
        </p>
      </header>
      <DeviceList
        libraryId={me.library.id}
        devices={devices}
        syncEnabled={me.entitlement.features.sync}
        deviceCount={me.entitlement.deviceCount}
        deviceLimit={me.entitlement.deviceLimit}
      />
    </main>
  );
}
