export type BadgeTone = "primary" | "neutral" | "success" | "warning" | "error";

export function getSeverityTone(severity: "low" | "medium" | "high" | "critical"): BadgeTone {
  if (severity === "low") return "success";
  if (severity === "medium") return "warning";
  if (severity === "high") return "error";
  return "error";
}

export function getNotificationTone(type: "report" | "alert" | "achievement"): BadgeTone {
  if (type === "alert") return "warning";
  if (type === "achievement") return "success";
  return "primary";
}
