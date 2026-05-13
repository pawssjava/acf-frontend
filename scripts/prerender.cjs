const { run } = require("react-snap");

const options = {
  source: "dist",
  include: [
    "/",
    "/news",
    "/tournaments",
    "/partners",
    "/education",
    "/login",
    "/register",
    "/forgot-password",
  ],
  crawl: false,
  inlineCss: false,
  puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
};

if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  options.puppeteerExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

run(options).catch((e) => {
  console.error("react-snap failed:", e.message);
  process.exit(1);
});
