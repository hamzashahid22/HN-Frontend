import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: "#f8fafc"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a"
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff"
  },
  error: {
    color: "#b91c1c"
  },
  muted: {
    color: "#64748b"
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a"
  },
  composer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  messageBubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginVertical: 4
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  }
});
