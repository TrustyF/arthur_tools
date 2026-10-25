import { type FormEvent, startTransition } from "react";

// <form action> resets uncontrolled fields after the action, wiping input on
// a returned error. Use as onSubmit to dispatch the same action without it.
export function submitWithoutReset(action: (formData: FormData) => void) {
	return (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(() => action(formData));
	};
}
