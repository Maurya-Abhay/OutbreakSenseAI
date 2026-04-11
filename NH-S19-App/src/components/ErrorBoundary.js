import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Optional: Send error to logging service
    if (typeof this.props.onError === "function") {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional reset handler
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={64} color="#DC2626" />
            </View>

            <Text style={styles.title}>Oops! Something Went Wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Please try again.
            </Text>

            {isDevelopment && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
                <Text style={styles.errorText} numberOfLines={5}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.resetButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={this.handleReset}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.buttonText}>Try Again</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.homeButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => this.props.onNavigateHome?.()}
              >
                <Ionicons name="home" size={18} color="#0F172A" />
                <Text style={[styles.buttonText, { color: "#0F172A" }]}>
                  Go Home
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20
  },
  content: {
    alignItems: "center",
    maxWidth: 400
  },
  iconContainer: {
    marginBottom: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center"
  },
  message: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 3,
    borderLeftColor: "#DC2626",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: "100%"
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 8
  },
  errorText: {
    fontSize: 11,
    color: "#991B1B",
    fontFamily: "monospace"
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    width: "100%"
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48
  },
  resetButton: {
    backgroundColor: "#DC2626"
  },
  homeButton: {
    backgroundColor: "#E2E8F0"
  },
  buttonPressed: {
    opacity: 0.8
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff"
  }
});

export default ErrorBoundary;
