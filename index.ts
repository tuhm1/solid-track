import {
  Accessor,
  createReaction,
  createSignal,
  getOwner,
  runWithOwner,
} from "solid-js";

/**
 * Creates a function to read and track signals. Must be called synchronously
 * inside the reactive context.
 *
 * @example
 * ```javascript
 * createEffect(async () => {
 *  const ref = useTrack();
 *
 *  await asyncFunction();
 *
 *  console.log(ref(signalA) + ref(signalB));
 * });
 * ```
 *
 * @returns function to read and track signals
 */
export function useTrack() {
  const owner = getOwner();
  const [changed, setChanged] = createSignal(false);
  changed();

  return function ref<T>(signal: Accessor<T>): T {
    return runWithOwner(owner, () => {
      if (changed() === true) {
        return signal();
      }
      let value: T;
      const track = createReaction(() => setChanged(true));
      track(() => (value = signal()));
      return value!;
    })!;
  };
}
