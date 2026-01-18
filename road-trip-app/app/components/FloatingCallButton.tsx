import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface FloatingCallButtonProps {
  onPress: () => void;
  visible?: boolean;
}

export const FloatingCallButton: React.FC<FloatingCallButtonProps> = ({
  onPress,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>📞</Text>
      <Text style={styles.text}>Call</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 2,
  },
});
