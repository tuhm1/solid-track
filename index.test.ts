import { createSignal, createEffect } from "solid-js";
import { expect, test, vi } from "vitest";
import { useTrack } from ".";

test("tracks signals in asynchronous context", async () => {
  const [a, setA] = createSignal(0);
  const [b, setB] = createSignal(1);
  let result;
  createEffect(() => {
    const ref = useTrack();
    result = delay(50).then(() => ref(a) + ref(b));
  });
  expect(await result).toBe(1);

  setA(1);
  expect(await result).toBe(2);

  setB(2);
  expect(await result).toBe(3);
});

test("dynamic dependencies", async () => {
  const [a, setA] = createSignal(0);
  const [b, setB] = createSignal(1);
  const [c, setC] = createSignal(2);
  let result;
  createEffect(() => {
    const ref = useTrack();
    if (a() === 0) {
      result = delay(50).then(() => ref(b));
    } else {
      result = delay(50).then(() => ref(c));
    }
  });
  expect(await result).toBe(1);

  setB(3);
  expect(await result).toBe(3);

  setC(4);
  expect(await result).toBe(3);

  setA(1);
  expect(await result).toBe(4);

  setB(5);
  expect(await result).toBe(4);

  setC(6);
  expect(await result).toBe(6);
});

test("doesn't track if reactive context updated", async () => {
  const [a, setA] = createSignal(0);
  const [b, setB] = createSignal(0);
  const effect = vi.fn(async () => {
    if (a() === 1) return;
    const ref = useTrack();
    await delay(50);
    ref(b);
  });
  createEffect(effect);
  setA(1);
  expect(effect).toHaveBeenCalledTimes(2);
  await delay(60);
  setB(1);
  expect(effect).toHaveBeenCalledTimes(2);
});

test("doesn't affect other scope", () => {
  const [signal, setSignal] = createSignal(0);
  let f: Function;
  createEffect(() => {
    const ref = useTrack();
    f = () => ref(signal);
  });
  const other = vi.fn(() => f());
  createEffect(other);
  expect(other).toHaveBeenCalledTimes(1);
  setSignal(1);
  expect(other).toHaveBeenCalledTimes(1);
});

test("tracking scopes are cleaned up", async () => {
  const cleanup = vi.fn();
  vi.doMock("solid-js", async (importOriginal) => {
    const solid = await importOriginal<typeof import("solid-js")>();
    const _createReaction = solid.createReaction;
    return {
      ...solid,
      createReaction: vi.fn((fn) => {
        solid.onCleanup(cleanup);
        return _createReaction(fn);
      }),
    };
  });

  vi.resetModules();
  const { useTrack } = await import(".");

  const [a, setA] = createSignal(0);
  const [b, setB] = createSignal(0);
  const [c, setC] = createSignal(0);
  await new Promise<void>((resolve) =>
    createEffect(async () => {
      const ref = useTrack();
      await delay(50);
      ref(a);
      await delay(50);
      ref(b);
      await delay(50);
      ref(c);
      resolve();
    })
  );
  setA(1);
  expect(cleanup).toHaveBeenCalledTimes(3);
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
