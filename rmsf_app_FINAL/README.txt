***IONIC APP FOR PROJECT WITH APP-SERVER-MICROCONTROLLER CONNECTION***

Requirements:
- Having Node.js installed
- Having an ionic account / ionic installed

Usage:
- npm install -g ionic@latest ( installs ionic)
- ionic start myApp (creates a new app)
- Copy everything inside the folder App_server-remote except this file to the myApp folder and delete previous content 

now 2 options for testing:
a) git push ionic master ( to push to only ionic server. Then can be tested through ionic DevApp )
 or
b) ionic serve -c  ( to host the app in localhost for testing)

build apk with android studio to have a deployable unit.

IMPORTANT NOTES:
1) The server in app code has to be changed considering which server is going to be used.
By default we are using our own server rmsf@rmsf.hadrons.xyz:3000

