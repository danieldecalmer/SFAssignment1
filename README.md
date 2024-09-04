# SFAssignment1
# General Plan
## Login Page
User can either create a new account by pressing the button to navigate to the create a new account page, or can log in using their credentials to take them to the Groups Page.

## Create a New Account Page
Email, Username and Password input boxes, and once the Create Account button is pressed, an id is generated for the user and the user can now log in using their new credentials.

## Groups Page
### Super Admin
Groups page shows a list of each group that exists and the user can click on a group to take them to that group's Channels Page. On each group listing, there is a 'Members' button on the right side that takes you to the 'Member List' page. For Super Admin and Group Admins, there is a 'Create New Group' button at the bottom.
### Group Admin
Same as Super Admin.
### Chat User
Same as Super Admin, but minus the 'Create New Group' functionality.

## Member List Page
### Super Admin
A list of the members in the chosen group is displayed, with a 'Promote' button and 'Kick' button next to each member's name. Additionally, for the respective Group Admin, a star is placed next to their name to indicate their status.
### Group Admin
Same as Super Admin for groups in which the Group Admin is administering. For groups the Group Admin does not administer, the 'Promote' and 'Kick' buttons are not available.
### Chat User
A list of the members in the chosen group is displayed, and the administering Group Admin for that group has a star placed next to their name to indicate their status.

## Channels Page
A list of channels is shown, with the option to navigate to whichever channel the user chooses which will take them to the respective 'Chat Page'. Super Admin and respective Group Admin have a 'Create New Channel' button at the bottom of the page.

## Chat Page
Same view for everyone: A standard scrollable chat window. Incoming messages on the left, with a name and time attached to them. Outgoing messages on the right with name and time attached to them. There is a message input box on the bottom with a 'Send' button.