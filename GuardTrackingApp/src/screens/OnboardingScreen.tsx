// Onboarding Screen Component
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../utils/theme';
import Button from '../components/common/Button';
import Logo from '../assets/images/tracSOpro-logo.png';
import Step1 from '../assets/images/intro/step-1.svg';
import Step2 from '../assets/images/intro/step-2.svg';
import Step3 from '../assets/images/intro/step-3.svg';

type OnboardingScreenNavigationProp = StackNavigationProp<any, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to tracSOpro',
    subtitle: 'Your complete security solution',
    description: 'Streamline your security operations with advanced guard management and incident reporting.',
    icon: '🛡️',
  },
  {
    id: 2,
    title: 'Location Tracking',
    subtitle: 'Real-time monitoring',
    description: 'Automatically track guard locations and clock in/out events at your assigned sites.',
    icon: '📍',
  },
  {
    id: 3,
    title: 'Quick Reporting',
    subtitle: 'Instant incident reports',
    description: 'Submit incident reports with photos, options and custom notes.',
    icon: '📊',
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const illustrations = [Step1, Step2, Step3];

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width }]}> 
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        {(() => {
          const SvgMaybe: any = illustrations[index];
          if (typeof SvgMaybe === 'function') {
            return <SvgMaybe width={280} height={200} />;
          }
          return <View style={styles.illustrationBox} />;
        })()}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {slide.title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {slide.description}
        </Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {slides.map((_, dotIndex) => (
          <View
            key={dotIndex}
            style={[
              styles.paginationDot,
              {
                backgroundColor: dotIndex === index 
                  ? theme.colors.primary 
                  : theme.colors.gray[300]
              }
            ]}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          title={currentSlide === slides.length - 1 ? "Let's get started" : "Continue"}
          onPress={handleNext}
          variant="primary"
          size="large"
          fullWidth
          style={styles.continueButton}
        />
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: theme.colors.text.tertiary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationBox: {
    width: 280,
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  illustrationIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  illustrationContent: {
    flexDirection: 'row',
    gap: 8,
  },
  illustrationElement: {
    width: 40,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionContainer: {
    paddingBottom: 20,
  },
  continueButton: {
    marginBottom: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoImage: {
    width: 140,
    height: 136,
  },
});

export default OnboardingScreen;
