# JIRA Proxy

Allows a user to make api calls by attaching a browser session cookie to a request header via proxy.

*But why do this?* Our specific setup does not allow api tokens, and an SSO infront of JIRA means basic auth is not supported.

## Authenticating

Grab the cookie named `JSESSIONID` and use that in basic auth, with the username being `nouser` and the password as the cookie value. Note that this cookie is unique to your login and should not be shared with other users, as it would allow them to impersonate your jira actions.