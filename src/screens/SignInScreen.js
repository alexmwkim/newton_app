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
import { useAuth } from '../contexts/AuthContext';

const SignInScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        Alert.alert('Sign In Failed', error);
        return;
      }
      
      // AuthContext will automatically handle navigation
      console.log('Sign in successful:', data);
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = (provider) => {
    Alert.alert('Social Sign In', `${provider} sign in will be implemented soon.`);
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset will be implemented soon.');
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your Newton account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor={Colors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoFocus={true}
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
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.secondaryText}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.secondaryText}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Icon name="check" size={14} color={Colors.white} />}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
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
                onPress={() => handleSocialSignIn('Google')}
              >
                <Icon name="globe" size={20} color={Colors.primaryText} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialSignIn('Apple')}
              >
                <Icon name="smartphone" size={20} color={Colors.primaryText} />
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('signUp')}
              >
                Sign Up
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
    color: Colors.primaryText,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
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
    color: Colors.primaryText,
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
    color: Colors.primaryText,
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
    color: Colors.primaryText,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: Layout.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.floatingButton,
    borderColor: Colors.floatingButton,
  },
  rememberMeText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
  signInButton: {
    backgroundColor: Colors.floatingButton,
    borderRadius: 10,
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signInButtonText: {
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
    color: Colors.secondaryText,
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
    color: Colors.primaryText,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  footerText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  linkText: {
    color: Colors.floatingButton,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default SignInScreen;