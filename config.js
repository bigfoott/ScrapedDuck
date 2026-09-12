module.exports = {
  REPO_OWNER: "hector-hyrivera",
  REPO_NAME: "ScrapedDuck",
  DATA_BRANCH: "data",
  get fallbackBaseUrl() {
    return `https://raw.githubusercontent.com/${this.REPO_OWNER}/${this.REPO_NAME}/${this.DATA_BRANCH}`;
  },
  get generatorUrl() {
    return `https://github.com/${this.REPO_OWNER}/${this.REPO_NAME}`;
  }
};
