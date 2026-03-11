import {
  default as useMeasureHook,
  Options,
  RectReadOnly,
} from 'react-use-measure';

export type Measurements = RectReadOnly;

function useMeasure(
  options?: Omit<Options, 'polyfill'>
): ReturnType<typeof useMeasureHook> {
  return useMeasureHook(options);
}

export default useMeasure;
