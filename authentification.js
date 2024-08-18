export function oauthSignIn() {
  var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

  var form = document.createElement("form");
  form.setAttribute("method", "GET"); // Send as a GET request.
  form.setAttribute("action", oauth2Endpoint);

  var params = {
    client_id:
      "116365897040-jmu3p8uo4h677a9ev57uag1fqruq274t.apps.googleusercontent.com",
    redirect_uri: "https://chepakilecookie.github.io/Youtube-Playlist-Tracker",
    response_type: "token",
    scope: "https://www.googleapis.com/auth/youtube",
    include_granted_scopes: "true",
    state: "pass-through value",
  };

  for (var p in params) {
    var input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", p);
    input.setAttribute("value", params[p]);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
