import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ICON_MAP = {
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  chrome: "google",
  compass: "compass",
  "edit-2": "pencil-outline",
  "eye-off": "eye-off",
  eye: "eye",
  menu: "menu",
  quote: "format-quote-open",
  "refresh-cw": "refresh",
  search: "magnify",
  "trash-2": "trash-can-outline",
  x: "close",
};

export const Feather = ({ name, size = 24, color, style, testID }) => {
  const iconName = ICON_MAP[name] || "help-circle-outline";

  return (
    <View style={style}>
      <MaterialCommunityIcons name={iconName} size={size} color={color} testID={testID} />
    </View>
  );
};

export default Feather;
