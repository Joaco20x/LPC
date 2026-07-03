const JsdomEnvironment = require("jest-environment-jsdom").default;

class JsdomWithFetchEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();
    this.global.fetch = fetch;
    this.global.Response = Response;
    this.global.Request = Request;
    this.global.Headers = Headers;
    if (!this.global.Blob.prototype.arrayBuffer) {
      const FileReader = this.global.FileReader;
      if (typeof FileReader?.prototype?.readAsArrayBuffer === "function") {
        this.global.Blob.prototype.arrayBuffer = function () {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(this);
          });
        };
      }
    }
  }
}

module.exports = JsdomWithFetchEnvironment;
