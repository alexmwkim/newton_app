import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, just navigate to sign in after successful signup
      Alert.alert('Success', 'Account created successfully! Please sign in.');
      navigation.navigate('signIn');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = (provider) => {
    Alert.alert('Social Sign Up', `${provider} sign up will be implemented soon.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Newton to start taking notes</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp('Google')}
              >
                <Icon name="globe" size={20} color={Colors.textPrimary} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignUp('Apple')}
              >
                <Icon name="smartphone" size={20} color={Colors.textPrimary} />
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('signIn')}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Layout.spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textPrimary,
    borderWidth: 0,
  },
  eyeIcon: {
    paddingHorizontal: Layout.spacing.md,
  },
  errorText: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: '#FF4444',
    marginTop: Layout.spacing.xs,
  },
  signUpButton: {
    backgroundColor: Colors.floatingButton,
    borderRadius: 10,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
    marginHorizontal: Layout.spacing.md,
  },
  socialButtons: {
    gap: Layout.spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.white,
    gap: Layout.spacing.sm,
  },
  socialButtonText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  footerText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.textSecondary,
  },
  linkText: {
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default SignUpScreen;