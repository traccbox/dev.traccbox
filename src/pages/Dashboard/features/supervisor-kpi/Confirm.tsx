import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, HelpCircle, Info } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { btnGhost, inputCls } from "./ui";

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  /** "danger" for destructive actions, "info" for a message with a single button. */
  tone?: "default" | "danger" | "info";
  /** The user must type this exactly before confirming (irreversible actions). */
  requireText?: string;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<Confirm | null>(null);

/** One modal for every confirmation and notice: `if (await confirm({...})) { … }` */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setTyped("");
        setOptions(next);
        setOpen(true);
      }),
    [],
  );

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpen(false);
  };

  const tone = options?.tone ?? "default";
  const Icon = tone === "danger" ? AlertTriangle : tone === "info" ? Info : HelpCircle;
  const blocked = !!options?.requireText && typed.trim() !== options.requireText;
  const primary = tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#1658E5] hover:bg-[#1249bd]";

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => !o && close(false)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#1658E5]"}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-base">{options?.title}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-sm text-gray-500">{options?.message}</div>
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          {options?.requireText && (
            <label className="block space-y-1 text-xs text-gray-600">
              Type <strong className="text-gray-900">{options.requireText}</strong> to confirm
              <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} />
            </label>
          )}
          <AlertDialogFooter>
            {tone !== "info" && <AlertDialogCancel className={`${btnGhost} mt-0`}>Cancel</AlertDialogCancel>}
            <AlertDialogAction disabled={blocked} onClick={() => close(true)} className={`h-9 rounded-lg px-4 text-sm font-medium text-white ${primary}`}>
              {options?.confirmLabel ?? (tone === "info" ? "Got it" : "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
};

export const useConfirm = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useConfirm must be used inside ConfirmProvider");
  return c;
};
