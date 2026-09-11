import { SiteHeader } from "@/components/site-header";
import { CreateLibraryForm } from "@/components/create-library-form";
import { SyncCodeForm } from "@/components/sync-code-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <section className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Keep your fonts in sync across every device
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Upload font files on one machine, share a short sync code, and
            download the same library anywhere else. No accounts — just your
            code.
          </p>
        </section>

        <Tabs defaultValue="create" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create library</TabsTrigger>
            <TabsTrigger value="sync">Enter sync code</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>New font library</CardTitle>
                <CardDescription>
                  Name your set — for example &quot;Work fonts&quot; or
                  &quot;Brand A&quot; — then upload files on the next screen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateLibraryForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Open a shared library</CardTitle>
                <CardDescription>
                  Enter the sync code from your other device to view and download
                  its fonts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SyncCodeForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
