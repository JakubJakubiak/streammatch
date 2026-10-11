import { useImperativeHandle, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Radius } from '@/constants/theme';

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 800;
const EXIT_MS = 220;

export type SwipeCardHandle = { swipe: (liked: boolean) => void };

/** A draggable card. Dragging or flinging it past the threshold commits the swipe. */
export function SwipeCard({
  children,
  onSwiped,
  ref,
}: {
  children: ReactNode;
  onSwiped: (liked: boolean) => void;
  ref?: Ref<SwipeCardHandle>;
}) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const exit = (liked: boolean) => {
    'worklet';
    x.set(
      withTiming((liked ? 1 : -1) * width * 1.4, { duration: EXIT_MS }, (finished) => {
        if (finished) scheduleOnRN(onSwiped, liked);
      }),
    );
  };

  useImperativeHandle(ref, () => ({ swipe: (liked) => exit(liked) }));

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onChange((event) => {
      x.set(x.get() + event.changeX);
      y.set(y.get() + event.changeY);
    })
    .onEnd((event) => {
      const far = Math.abs(x.get()) > SWIPE_DISTANCE;
      const fast = Math.abs(event.velocityX) > SWIPE_VELOCITY;
      if (far || fast) {
        exit((far ? x.get() : event.velocityX) > 0);
      } else {
        x.set(withSpring(0));
        y.set(withSpring(0));
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { rotate: `${interpolate(x.get(), [-width, width], [-14, 14])}deg` },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, SWIPE_DISTANCE], [0, 1], 'clamp'),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-SWIPE_DISTANCE, 0], [1, 0], 'clamp'),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
        {children}
        <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]}>
          <Text style={[styles.stampLabel, { color: Colors.like }]}>GG</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.passStamp, passStyle]}>
          <Text style={[styles.stampLabel, { color: Colors.pass }]}>SKIP</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: 36,
    borderWidth: 3,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeStamp: { left: 24, borderColor: Colors.like, transform: [{ rotate: '-16deg' }] },
  passStamp: { right: 24, borderColor: Colors.pass, transform: [{ rotate: '16deg' }] },
  stampLabel: { fontSize: 32, fontWeight: '900', letterSpacing: 1 },
});
