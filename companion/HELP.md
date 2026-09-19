## Audio Technica Digital Mixer

This module will allow you to control an Audio Technica Digital Mixer.

### Configuration
* Enter the IP address of the device in the configuration settings. The control port is 17300 unless it
  has been changed in the mixer's network settings.
* Select the model. This determines which actions, feedbacks and variables are available. Choose
  "ATDM-1012 / ATDM-1012DAN" for either variant.
* **Commands In Flight** is how many commands may be outstanding at once. The mixer processes commands
  asynchronously, so sending several without waiting makes polling far quicker. Lower it to 1 if the
  mixer reports Busy errors.
* **Enable Polling** asks the mixer for its current state on a timer. Turn it off if you only send
  commands and do not use feedbacks or variables.
* **Polling Interval** is how often that happens. An ATDM-1012 requests around 200 values in a full
  poll, so short intervals generate a lot of traffic; 1000 ms or slower is recommended. A poll is
  skipped if the previous one has not finished, and button actions are always sent ahead of polling
  traffic, so a button press is never delayed by a poll in progress.

### Notifications

The mixer can push changes made at its front panel, in Web Remote or by another controller over UDP
multicast. This keeps feedbacks current without waiting for the next poll, and lets the module reduce a
full poll to only the settings the mixer never announces.

To use it, turn on **IP Control Settings > Notification** in the mixer's network settings - it is **Off
by default** - then tick **Listen for Notifications** here. The multicast address and port must match the
mixer's; the protocol default is 225.0.0.100:17000, but some models ship with 239.0.0.100. On a machine
with several networks you may also need to set the network interface to the one facing the mixer.

**Receive Level Meters** additionally requires **Audio Level Notification** on the mixer. Level meters
are sent continuously, so only turn this on if you use the meter variables.

Without notifications, feedbacks and variables can only be as current as the polling interval: a button
pressed in Companion updates its own feedback immediately, but a change made elsewhere is not reflected
until the next poll.

### Notes

* The mixer accepts a maximum of five simultaneous connections. Web Remote and other control systems
  count towards that limit, so a sixth connection will simply fail.

**Available Actions:**
* Set Input Gain Level (Mic Gain, Line Gain, Level, Max Vol) and Input Mute
* Set Input Channel Settings (Source, Phantom Power, Low Cut, AEC, Smart Mix, Channel Name, Color)
* Set Gain Share Settings (Input Channel Gain Share Weight)
* Set Output Level and Output Mute
* Call Preset, Call Partial Preset, Save Preset, Set Boot Up Preset
* Operator Page fader level and mute (ATDM-1012), Web Remote Operator Fader mute
* Identify (blink the front panel LEDs)
* Set Front Panel Restrictions (ATDM-1012)
* Set Smart Mix Mode and Number of Open Mics (ATDM-1012)
* Set Feedback Suppressor (ATDM-1012)
* Set Ducker, USB Output and Oscillator test tone (ATDM-1012)
* Recall, save, flatten or reset an Output EQ library (ATDM-1012)
* Set Smart Mix channel settings - gain share weight, priority, can cut, closed mic attenuation, threshold (ATDM-1012)
* Run AEC Calibration (ATDM-0604, ATDM-0604a)

**Available Feedbacks:**
* Phantom Power is On
* Low Cut is On
* AEC is On
* Smart Mix is On
* Input Mute is On
* Output Mute is On
* Operator Fader is Muted (ATDM-1012)
* Recorder Status (ATDM-1012)
* AEC Calibration Result (ATDM-0604, ATDM-0604a)

**Available Variables:**
* Input Gain Level (Mic Gain, Line Gain, Level Mute)
* Input Channel Settings (Source, Phantom Power, Phase, Low Cut, AEC, Smart Mix, Channel Name, Color)
* Output Level
* Output Mute
* Output Channel Settings (Unity, Channel Name)
* Preset Number / Partial Preset Number, and Preset Bank Names
* Meter Level (named per monitor point; requires notifications)
* Firmware Version and Device ID
* Recorder Status (ATDM-1012)