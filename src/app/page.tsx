import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Page() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20">
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove
              your data from our servers. This action cannot be undone. This will permanently delete
              your account and remove your data from our servers. This action cannot be undone. This
              will permanently delete your account and remove your data from our servers. This
              action cannot be undone. This will permanently delete your account and remove your
              data from our servers. This action cannot be undone. This will permanently delete your
              account and remove your data from our servers. This action cannot be undone. This will
              permanently delete your account and remove your data from our servers. This action
              cannot be undone. This will permanently delete your account and remove your data from
              our servers. This action cannot be undone. This will permanently delete your account
              and remove your data from our servers. This action cannot be undone. This will
              permanently delete your account and remove your data from our servers. This action
              cannot be undone. This will permanently delete your account and remove your data from
              our servers. This action cannot be undone. This will permanently delete your account
              and remove your data from our servers. This action cannot be undone. This will
              permanently delete your account and remove your data from our servers. This action
              cannot be undone. This will permanently delete your account and remove your data from
              our servers.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
