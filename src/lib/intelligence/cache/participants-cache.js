/** School scope helpers for intelligence modules (mirrors 02dev participants-cache). */
let activeSchoolId = "zero2dev";

export function setActiveSchool(id) {
  activeSchoolId = id || "zero2dev";
}

export function getActiveSchool() {
  return activeSchoolId;
}

export function schoolScoped(collectionName) {
  return collectionName;
}
