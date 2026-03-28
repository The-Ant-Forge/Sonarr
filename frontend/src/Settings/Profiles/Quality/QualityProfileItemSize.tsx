import React, { HTMLProps, useCallback, useRef, useState } from 'react';
import ReactSlider from 'react-slider';
import NumberInput from 'Components/Form/NumberInput';
import Label from 'Components/Label';
import IconButton from 'Components/Link/IconButton';
import Popover from 'Components/Tooltip/Popover';
import { icons, kinds, tooltipPositions } from 'Helpers/Props';
import QualityDefinitionLimits from 'Settings/Quality/Definition/QualityDefinitionLimits';
import { InputChanged } from 'typings/inputs';
import formatBytes from 'Utilities/Number/formatBytes';
import roundNumber from 'Utilities/Number/roundNumber';
import translate from 'Utilities/String/translate';
import styles from './QualityProfileItemSize.css';

const MIN = 0;
const MAX = 100;
const STEP_SIZE = 0.1;

// Exponent for the slider power curve. Higher = more precision at low values.
// 1.5 spreads the 0-20 MiB/min range (AV1/x265 territory) across ~30% of
// the slider instead of ~5% with the old 1.1 exponent.
const SLIDER_EXPONENT = 1.5;
const SLIDER_MAX = roundNumber(Math.pow(MAX, 1 / SLIDER_EXPONENT));

interface SizeProps {
  minSize: number;
  preferredSize: number;
  maxSize: number;
}

export interface SizeChanged {
  qualityId: number;
  minSize: number | null;
  preferredSize: number | null;
  maxSize: number | null;
}

export interface QualityProfileItemSizeProps {
  id: number;
  minSize: number | null;
  preferredSize: number | null;
  maxSize: number | null;
  onSizeChange: (props: SizeChanged) => void;
  onCopySizesDown?: (qualityId: number) => void;
}

function trackRenderer(props: HTMLProps<HTMLDivElement>) {
  return <div {...props} className={styles.track} />;
}

function thumbRenderer(props: HTMLProps<HTMLDivElement>) {
  return <div {...props} className={styles.thumb} />;
}

function toSlider(value: number | null, defaultValue: number): number {
  return roundNumber(value ? Math.pow(value, 1 / SLIDER_EXPONENT) : defaultValue);
}

function fromSlider(sliderValue: number): number {
  return roundNumber(Math.pow(sliderValue, SLIDER_EXPONENT));
}

export default function QualityProfileItemSize({
  id,
  minSize,
  maxSize,
  preferredSize,
  onSizeChange,
  onCopySizesDown,
}: QualityProfileItemSizeProps) {
  const [sliderSizes, setSliderSizes] = useState<SizeProps>({
    minSize: toSlider(minSize, MIN),
    preferredSize: toSlider(preferredSize, SLIDER_MAX),
    maxSize: toSlider(maxSize, SLIDER_MAX),
  });

  // Notify parent with null for "unlimited" (slider at max).
  const emitChange = useCallback(
    (min: number, pref: number, max: number) => {
      onSizeChange?.({
        qualityId: id,
        minSize: min,
        preferredSize: pref >= MAX ? null : pref,
        maxSize: max >= MAX ? null : max,
      });
    },
    [id, onSizeChange]
  );

  // Slider drag: convert from slider scale, clamp min <= pref <= max.
  const handleSliderChange = useCallback(
    ([sMin, sPref, sMax]: [number, number, number]) => {
      setSliderSizes({ minSize: sMin, preferredSize: sPref, maxSize: sMax });
      emitChange(fromSlider(sMin), fromSlider(sPref), fromSlider(sMax));
    },
    [setSliderSizes, emitChange]
  );

  // After slider release, sync slider thumbs to the canonical prop values.
  const handleAfterSliderChange = useCallback(() => {
    setSliderSizes({
      minSize: toSlider(minSize, MIN),
      preferredSize: toSlider(preferredSize, SLIDER_MAX),
      maxSize: toSlider(maxSize, SLIDER_MAX),
    });
  }, [minSize, maxSize, preferredSize]);

  // Debounce timer for number inputs — lets you finish typing before
  // clamping fires (e.g. changing 23 → 18 without "3" clamping mid-edit).
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedEmit = useCallback(
    (min: number, pref: number, max: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        emitChange(min, pref, max);
      }, 500);
    },
    [emitChange]
  );

  // Number input handlers: update slider immediately for visual feedback,
  // but debounce the clamping + parent notification by 500ms.
  const handleMinSizeChange = useCallback(
    ({ value }: InputChanged<number>) => {
      setSliderSizes((prev) => ({
        ...prev,
        minSize: toSlider(value, MIN),
      }));

      const newMin = value;
      const newPref = Math.max(preferredSize ?? MAX, newMin);
      const newMax = Math.max(maxSize ?? MAX, newPref);

      debouncedEmit(newMin, newPref, newMax);
    },
    [preferredSize, maxSize, debouncedEmit]
  );

  const handlePreferredSizeChange = useCallback(
    ({ value }: InputChanged<number>) => {
      setSliderSizes((prev) => ({
        ...prev,
        preferredSize: toSlider(value, SLIDER_MAX),
      }));

      const newPref = value;
      const newMin = Math.min(minSize ?? 0, newPref);
      const newMax = Math.max(maxSize ?? MAX, newPref);

      debouncedEmit(newMin, newPref, newMax);
    },
    [minSize, maxSize, debouncedEmit]
  );

  const handleMaxSizeChange = useCallback(
    ({ value }: InputChanged<number>) => {
      setSliderSizes((prev) => ({
        ...prev,
        maxSize: toSlider(value, SLIDER_MAX),
      }));

      const newMax = value;
      const newPref = Math.min(preferredSize ?? MAX, newMax);
      const newMin = Math.min(minSize ?? 0, newPref);

      debouncedEmit(newMin, newPref, newMax);
    },
    [minSize, preferredSize, debouncedEmit]
  );

  const handleCopySizesDown = useCallback(() => {
    onCopySizesDown?.(id);
  }, [id, onCopySizesDown]);

  const minBytes = (minSize || 0) * 1024 * 1024;
  const minSixty = `${formatBytes(minBytes * 60)}/${translate(
    'HourShorthand'
  )}`;

  const preferredBytes = (preferredSize || 0) * 1024 * 1024;
  const preferredSixty = preferredBytes
    ? `${formatBytes(preferredBytes * 60)}/${translate('HourShorthand')}`
    : translate('Unlimited');

  const maxBytes = maxSize && maxSize * 1024 * 1024;
  const maxSixty = maxBytes
    ? `${formatBytes(maxBytes * 60)}/${translate('HourShorthand')}`
    : translate('Unlimited');

  return (
    <div className={styles.sizeLimit}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore React version mismatch */}
      <ReactSlider
        className={styles.slider}
        min={MIN}
        max={SLIDER_MAX}
        step={STEP_SIZE}
        minDistance={0}
        value={[sliderSizes.minSize, sliderSizes.preferredSize, sliderSizes.maxSize]}
        withTracks={true}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore allowCross is still available in the version currently used
        allowCross={false}
        snapDragDisabled={true}
        pearling={false}
        renderThumb={thumbRenderer}
        renderTrack={trackRenderer}
        onChange={handleSliderChange}
        onAfterChange={handleAfterSliderChange}
      />

      <div className={styles.sizes}>
        <div>
          <Popover
            anchor={<Label kind={kinds.INFO}>{minSixty}</Label>}
            title={translate('MinimumLimits')}
            body={
              <QualityDefinitionLimits
                bytes={minBytes}
                message={translate('NoMinimumForAnyRuntime')}
              />
            }
            position={tooltipPositions.BOTTOM}
          />
        </div>

        <div>
          <Popover
            anchor={<Label kind={kinds.SUCCESS}>{preferredSixty}</Label>}
            title={translate('PreferredSize')}
            body={
              <QualityDefinitionLimits
                bytes={preferredBytes}
                message={translate('NoLimitForAnyRuntime')}
              />
            }
            position={tooltipPositions.BOTTOM}
          />
        </div>

        <div>
          <Popover
            anchor={<Label kind={kinds.WARNING}>{maxSixty}</Label>}
            title={translate('MaximumLimits')}
            body={
              <QualityDefinitionLimits
                bytes={maxBytes}
                message={translate('NoLimitForAnyRuntime')}
              />
            }
            position={tooltipPositions.BOTTOM}
          />
        </div>
      </div>

      <div className={styles.megabytesPerMinuteContainer}>
        {onCopySizesDown ? (
          <IconButton
            className={styles.copySizesDown}
            name={icons.CIRCLE_DOWN}
            title={translate('CopySizesToBelow')}
            onPress={handleCopySizesDown}
          />
        ) : null}

        <div className={styles.megabytesPerMinute}>
          <NumberInput
            className={styles.sizeInput}
            name={`${id}.min`}
            value={minSize || MIN}
            min={MIN}
            max={MAX}
            step={0.1}
            isFloat={true}
            // @ts-expect-error - Typings are too loose
            onChange={handleMinSizeChange}
          />
          <Label kind={kinds.INFO}>
            {translate('Minimum')} MiB/
            {translate('MinuteShorthand')}
          </Label>
        </div>

        <div className={styles.megabytesPerMinute}>
          <NumberInput
            className={styles.sizeInput}
            name={`${id}.preferred`}
            value={preferredSize || MAX}
            min={MIN}
            max={MAX}
            step={0.1}
            isFloat={true}
            // @ts-expect-error - Typings are too loose
            onChange={handlePreferredSizeChange}
          />

          <Label kind={kinds.SUCCESS}>
            {translate('Preferred')} MiB/
            {translate('MinuteShorthand')}
          </Label>
        </div>

        <div className={styles.megabytesPerMinute}>
          <NumberInput
            className={styles.sizeInput}
            name={`${id}.max`}
            value={maxSize || MAX}
            min={MIN}
            max={MAX}
            step={0.1}
            isFloat={true}
            // @ts-expect-error - Typings are too loose
            onChange={handleMaxSizeChange}
          />

          <Label kind={kinds.WARNING}>
            {translate('Maximum')} MiB/
            {translate('MinuteShorthand')}
          </Label>
        </div>
      </div>
    </div>
  );
}
