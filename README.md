
# Homebridge D-Link's DCH-S220 Wi-Fi enabled Siren Plugin

This plugin exposes the functionality of D-Link's DCH-S220 Siren as a Switch.

## Install

 * ```sudo npm install -g homebridge-dchs220-siren```
* Create an accessory in your config.json file
* Restart homebridge

## Example config.json:

 ```
    "accessories": [
        {
          "accessory": "SirenSwitch",
          "name": "DLink Siren",
          "ipAddress": "192.168.1.10",
          "pin": 123456,
          "sound": 2,
          "volume": 100,
          "duration": 88888,
          "updateInterval": 2000
        }
    ]

```



## Configuration Parameters
name: The name Homekit will give to your switch (you can change this later in Home app).
ipAddress: The IP Address of your Siren.
pin: 6 digit pin of your Siren, you can find it on the card included with it.
sound: The sound the sren will play upon turning it on, you may select one from the following list:

1 = Emergency
2 = Fire
3 = Ambulance
4 = Police
5 = Door Chime
6 = Beep

volume: Value from 1 to 100 determining the volume the siren should play at.
duration: Time in seconds the siren should play the sound (use 88888 for infinite).
updateInterval: Time in milliseconds the program will poll for siren status.
