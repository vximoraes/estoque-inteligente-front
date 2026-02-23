import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export function useFormApiErrors<TFieldValues extends FieldValues>(
  setError: UseFormSetError<TFieldValues>,
) {
  const setApiErrors = (errors?: Array<{ path: string; message: string }>) => {
    if (!errors || !Array.isArray(errors)) return;

    errors.forEach((err) => {
      setError(err.path as Path<TFieldValues>, {
        type: 'server',
        message: err.message,
      });
    });
  };

  return { setApiErrors };
}
