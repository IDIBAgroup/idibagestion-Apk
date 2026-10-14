import Swal from 'sweetalert2';

// Keep alerts inside the open native <dialog> (slide-over panels) so they stay on top.
const target = () =>
  typeof document === 'undefined' ? undefined : (document.querySelector<HTMLDialogElement>('dialog[open]') ?? document.body);

const customClass = {
  popup: 'swal-idiba',
  title: 'swal-idiba-title',
  htmlContainer: 'swal-idiba-text',
  confirmButton: 'swal-idiba-confirm',
  cancelButton: 'swal-idiba-cancel',
  actions: 'swal-idiba-actions',
};

const base = Swal.mixin({ buttonsStyling: false, customClass, reverseButtons: true });

/** Auto-dismissing toast (top-right). */
const toast = base.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
  customClass: { ...customClass, popup: 'swal-idiba swal-idiba-toast' },
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer);
    el.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const swalSuccess = (title: string, text?: string) => toast.fire({ target: target(), icon: 'success', title, text });
export const swalInfo = (title: string, text?: string) => toast.fire({ target: target(), icon: 'info', title, text });
export const swalError = (title: string, text?: string) =>
  base.fire({ target: target(), icon: 'error', title, text, confirmButtonText: 'Fermer' });

/** Confirmation dialog; resolves true when confirmed. */
export const swalConfirm = (title: string, text?: string, confirmText = 'Oui, supprimer') =>
  base
    .fire({
      target: target(),
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Annuler',
    })
    .then((result) => result.isConfirmed);
