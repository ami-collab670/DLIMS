export class CmsUnavailableError extends Error {
  constructor(message = "CMS is unavailable") {
    super(message);
    this.name = "CmsUnavailableError";
  }
}
