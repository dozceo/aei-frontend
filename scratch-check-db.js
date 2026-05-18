const https = require("https");

const projectId = "sankalp-prerollout";
const uid = "kmhEOxNgCIOjYYOAKZOKDZJkIDG2";

const collections = [
  `students/${uid}`,
  `users/${uid}/settings/profile`,
  `users/${uid}/settings/preferences`,
  `support_tickets`,
];

function fetchDoc(path) {
  return new Promise((resolve) => {
    https.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ path, status: res.statusCode, data: json });
        } catch (e) {
          resolve({ path, status: res.statusCode, error: e.message });
        }
      });
    }).on("error", (e) => resolve({ path, error: e.message }));
  });
}

async function check() {
  for (const path of collections) {
    console.log(`Checking ${path}...`);
    const result = await fetchDoc(path);
    if (result.status === 200) {
      console.log(`✅ Found:`, JSON.stringify(result.data).slice(0, 300));
    } else if (result.status === 404) {
      console.log(`❌ Not found (404)`);
    } else {
      console.log(`⚠️ Error ${result.status}:`, result.data?.error?.message || result.data);
    }
  }
}

check();
