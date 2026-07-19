import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export type AdminConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive delete / remove actions */
  tone?: 'danger' | 'default';
};

export function useAdminConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AdminConfirmOptions>({ title: 'Are you sure?' });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const finish = useCallback((value: boolean) => {
    const resolve = resolver.current;
    resolver.current = null;
    setOpen(false);
    resolve?.(value);
  }, []);

  const confirm = useCallback((opts: AdminConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const dialog: ReactNode = (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish(false);
      }}
    >
      <AlertDialogContent className="rounded-2xl border-[#e8eef4] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[17px] font-bold text-[#1e2a38]">
            {options.title}
          </AlertDialogTitle>
          {options.description ? (
            <AlertDialogDescription className="text-[13.5px] leading-relaxed text-[#7a8899]">
              {options.description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => finish(false)}
            className="h-10 rounded-[10px] border-[#e4ebf2] text-[13.5px] font-semibold text-[#516171]"
          >
            {options.cancelLabel ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              finish(true);
            }}
            className={
              options.tone === 'danger'
                ? 'h-10 rounded-[10px] bg-red-600 text-[13.5px] font-semibold text-white hover:bg-red-700'
                : 'h-10 rounded-[10px] bg-[#0ea5e9] text-[13.5px] font-semibold text-white hover:bg-[#0284c7]'
            }
          >
            {options.confirmLabel ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}
