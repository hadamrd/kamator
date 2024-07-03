import BaseCrudApi from "./BaseCrudApi";

class SessionsApi extends BaseCrudApi {
  constructor() {
    super("/sessions", "sessions");
  }

  getSessionImage(session) {
    return new URL(
      `/src/assets/session_type/${session.type}.png`,
      import.meta.url
    ).href;
  }
}

const sessionsApiInstance = new SessionsApi();
export default sessionsApiInstance;
