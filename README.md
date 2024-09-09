# solid-track

A SolidJS hook to track signals even in asynchronous contexts.

## Installation

```bash
npm install solid-track
```

### Usage

Call `useTrack` synchronously inside the reactive context to create a function to read and track signals.

```javascript
createEffect(async () => {
  const ref = useTrack();

  await asyncFunction();

  console.log(ref(signalA) + ref(signalB));
});
```
