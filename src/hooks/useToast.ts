import toast, { ToastOptions as HotToastOptions } from "react-hot-toast";

type ToastPosition = NonNullable<HotToastOptions["position"]>;

interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
  icon?: HotToastOptions["icon"];
}

const DEFAULT_POSITION: ToastPosition = "top-right";

const buildOptions = (
  options?: ToastOptions,
  defaults?: Partial<HotToastOptions>
): HotToastOptions => ({
  position: options?.position ?? DEFAULT_POSITION,
  ...defaults,
  ...(options ?? {}),
});

export const useToast = () => {
  const success = (message: string, options?: ToastOptions) =>
    toast.success(message, buildOptions(options, { duration: 4000 }));

  const error = (message: string, options?: ToastOptions) =>
    toast.error(message, buildOptions(options, { duration: 5000 }));

  const loading = (message: string, options?: ToastOptions) =>
    toast.loading(message, buildOptions(options));

  const info = (message: string, options?: ToastOptions) =>
    toast(message, {
      ...buildOptions(options, { duration: 4000 }),
      icon: options?.icon ?? "i",
      style: {
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1d4ed8",
      },
    });

  const warning = (message: string, options?: ToastOptions) =>
    toast(message, {
      ...buildOptions(options, { duration: 4000 }),
      icon: options?.icon ?? "!",
      style: {
        background: "#fffbeb",
        border: "1px solid #fed7aa",
        color: "#d97706",
      },
    });

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
      return;
    }
    toast.dismiss();
  };

  const promise = <T,>(
    promiseToResolve: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) =>
    toast.promise(promiseToResolve, messages, buildOptions(options));

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
    promise,
  };
};

export default useToast;
