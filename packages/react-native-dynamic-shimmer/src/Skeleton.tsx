import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { BoneContext, BoneRect, SkeletonProps } from "./types";
import { useVisibility } from "./visibility/useVisibility";
import { useMeasureBones } from "./measure/useMeasureBones";
import { useShimmerProgress } from "./animation/useShimmerProgress";
import { Bone as DefaultBone } from "./Bone";

const DEFAULT_MIN_SHOW = 500;
const DEFAULT_TRANSITION_MS = 300;
const DEFAULT_DELAY_SHOW = 100;

export function Skeleton(props: SkeletonProps): React.ReactElement {
  const {
    loading,
    children,
    baseColor,
    highlightColor,
    animation = "shimmer",
    minShowDuration = DEFAULT_MIN_SHOW,
    delayShowDuration = DEFAULT_DELAY_SHOW,
    transition = DEFAULT_TRANSITION_MS,
    classify,
    refineBones,
    renderBone,
    onMeasured,
    style,
    accessibilityLabel = "Loading",
  } = props;

  const containerRef = useRef<View>(null);
  const contentRef = useRef<View>(null);
  const isVisible = useVisibility(loading, minShowDuration, delayShowDuration);
  const { bones, handleLayout } = useMeasureBones(containerRef, contentRef, loading, {
    ...(classify !== undefined ? { classify } : {}),
    ...(refineBones !== undefined ? { refineBones } : {}),
    ...(onMeasured !== undefined ? { onMeasured } : {}),
  });
  const progress = useShimmerProgress(isVisible, animation);

  const overlayOpacity = useSharedValue(0);
  const [overlayMounted, setOverlayMounted] = useState(false);

  const transitionMs =
    transition === false ? 0 : transition === true ? DEFAULT_TRANSITION_MS : transition;

  useEffect(() => {
    if (isVisible) {
      setOverlayMounted(true);
      overlayOpacity.set(
        withTiming(1, {
          duration: transitionMs,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.System,
        }),
      );
    } else if (overlayMounted) {
      overlayOpacity.set(
        withTiming(
          0,
          {
            duration: transitionMs,
            easing: Easing.in(Easing.quad),
            reduceMotion: ReduceMotion.System,
          },
          (finished) => {
            "worklet";
            if (finished === true) runOnJS(setOverlayMounted)(false);
          },
        ),
      );
    }
  }, [isVisible, transitionMs, overlayOpacity, overlayMounted]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      collapsable={false}
      onLayout={handleLayout}
    >
      <View
        ref={contentRef}
        collapsable={false}
        style={loading ? styles.hidden : undefined}
        pointerEvents={loading ? "none" : "auto"}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {overlayMounted && bones !== null ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, overlayStyle]}
          pointerEvents="none"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ busy: true }}
        >
          {bones.map((rect: BoneRect, index: number) => {
            const ctx: BoneContext = {
              progress,
              baseColor,
              highlightColor,
              animation,
              index,
              total: bones.length,
            };
            const custom = renderBone?.(rect, ctx);
            if (custom !== undefined && custom !== null) {
              return <React.Fragment key={index}>{custom}</React.Fragment>;
            }
            return <DefaultBone key={index} rect={rect} ctx={ctx} />;
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  hidden: { opacity: 0 },
});
