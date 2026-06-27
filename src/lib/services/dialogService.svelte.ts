import type { DialogKind } from '$lib/components/AppDialog.svelte';

export function createDialogService() {
  let visible = $state(false);
  let kind = $state<DialogKind>('alert');
  let message = $state('');
  let input = $state('');

  let resolveAlert: (() => void) | null = null;
  let resolveConfirm: ((value: boolean) => void) | null = null;
  let resolvePrompt: ((value: string | null) => void) | null = null;

  function closeDialog() {
    visible = false;
  }

  function showAlert(dialogMessage: string): Promise<void> {
    return new Promise((resolve) => {
      kind = 'alert';
      message = dialogMessage;
      visible = true;
      resolveAlert = () => {
        resolveAlert = null;
        closeDialog();
        resolve();
      };
    });
  }

  function showConfirm(dialogMessage: string): Promise<boolean> {
    return new Promise((resolve) => {
      kind = 'confirm';
      message = dialogMessage;
      visible = true;
      resolveConfirm = (value) => {
        resolveConfirm = null;
        closeDialog();
        resolve(value);
      };
    });
  }

  function showPrompt(dialogMessage: string, defaultValue = ''): Promise<string | null> {
    return new Promise((resolve) => {
      kind = 'prompt';
      message = dialogMessage;
      input = defaultValue;
      visible = true;
      resolvePrompt = (value) => {
        resolvePrompt = null;
        closeDialog();
        resolve(value);
      };
    });
  }

  function confirm() {
    if (kind === 'alert') {
      resolveAlert?.();
    } else if (kind === 'confirm') {
      resolveConfirm?.(true);
    } else {
      resolvePrompt?.(input);
    }
  }

  function cancel() {
    if (kind === 'alert') {
      resolveAlert?.();
    } else if (kind === 'confirm') {
      resolveConfirm?.(false);
    } else {
      resolvePrompt?.(null);
    }
  }

  return {
    get visible() {
      return visible;
    },
    get kind() {
      return kind;
    },
    get message() {
      return message;
    },
    get input() {
      return input;
    },
    set input(value: string) {
      input = value;
    },
    showAlert,
    showConfirm,
    showPrompt,
    confirm,
    cancel
  };
}

export type DialogService = ReturnType<typeof createDialogService>;
