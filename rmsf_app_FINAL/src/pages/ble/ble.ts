import { Component, NgZone } from '@angular/core';
import { IonicPage, ViewController, ModalController, ToastController } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';
import { Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';

@IonicPage()
@Component({
  selector: 'page-ble',
  templateUrl: 'ble.html',
})

/*
* BlePage - Page associated with the bluetooth connection creation and unlock of the system
*
*/
export class BlePage {

  devices: any[] = []; //saves list of devices found by BLE to be cycled on
  espId: string = null; // id of the microcontroller (predefined)
  espUnlocked: boolean = false; // boolean to define if esp is either locked or unlocked
  statusMessage: string; // string with the status of the esp connection
  characteristic: string; // the characteristics that allow the connection to the microcontroller to be made
  service: string; //another data to identify the device and make the connection

  constructor(public viewCtrl: ViewController , 
              public modalCtrl: ModalController,
              private toastCtrl: ToastController,
              private ble: BLE,
              private ngZone: NgZone,
              public plt: Platform,
              public storage: Storage              
            ) {
  }

  // this function is called whenever we enter the BLE page
  ionViewDidEnter() {
    this.ble.isEnabled().then(() => {
      console.log("Bluetooth is enabled!");
    }, (error) => {
      console.log("Bluetooth is not enabled!");
      let toast = this.toastCtrl.create({
        message: 'Bluetooth is not enabled!',
        position: 'middle',
        duration: 5000
      });
      toast.present();
    });
    this.scan();
  }

  // Scans for BLE devices nearby
  scan() {
    this.setStatus('Scanning for Bluetooth LE Devices');
    this.devices = [];  // clear list
    this.ble.scan([], 10).subscribe(
      device => this.onDeviceDiscovered(device), 
      error => this.scanError(error)
    );
    setTimeout(this.setStatus.bind(this), 5000, 'Scan complete');
  }

  //Whenever we discover a device, we search among its name and characteristics for the ones associated with our microcontroller
  onDeviceDiscovered(device) {
    console.log('Discovered ' + JSON.stringify(device, null, 2));
    //connection with ESP32 - TEST ONLY
    if(device.name == "MyESP32"){
      this.ble.connect(device.id).subscribe(peripheralData => {
        this.espId = device.id;
        console.log('Characteristics ' + JSON.stringify(peripheralData, null, 2));
        if(this.plt.is('android')){
          loop:
          for(var i=0; i < peripheralData.characteristics.length; i++ ){
            for(var j=0; j < peripheralData.characteristics[i].properties.length; j++){
              console.log("----> ")
              if(peripheralData.characteristics[i].properties[j] == "Write"){
                this.service = peripheralData.characteristics[i].service;
                this.characteristic = peripheralData.characteristics[i].characteristic;
                break loop;
              }
            }
          }
        }else{
          this.service = peripheralData.characteristics[0].service;
          this.characteristic = peripheralData.characteristics[0].characteristic;
        }
        this.write(device);
      }, peripheralData => {
        console.log("disconnected");
      })
    }
    this.ngZone.run(() => {
      this.devices.push(device);
    });
  }

// we tell the device our password and username so that it can compare with server database information (by the microcontroller)
//to guarantee we are granted access and unlock the system
  write(device){
    Promise.all([this.storage.get("username"), this.storage.get("password")]).then(values => {
      console.log("username", values[0]);
      console.log("password", values[1]);
    
      let value = this.stringToBytes(values[0] + ":" + values[1]);

      console.log(device.id + ' ' + this.service + ' ' + this.characteristic);

      this.ble.write(device.id, this.service, this.characteristic, value).then(() => {
        console.log("The value was written!");
      }, (error) => {
        console.log("The value was not written!");
      });

      this.ble.startNotification(device.id, this.service, this.characteristic).subscribe(
        data => {
          console.log("ESP32 " + this.bytesToString(data));
          let state = this.bytesToString(data);
          if(state == "Unlocked"){
            this.ngZone.run(() => {
              this.espUnlocked = true;
            });
          }else if(state == "Locked"){
            this.ngZone.run(() => {
              this.espUnlocked = false;
            });
          }
        },
        () => console.log("Notification error")
      );
  });

  }

  // If location permission is denied, you'll end up here
  scanError(error) {
    this.setStatus('Error ' + error);
    let toast = this.toastCtrl.create({
      message: 'Error scanning for Bluetooth low energy devices',
      position: 'middle',
      duration: 5000
    });
    toast.present();
  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  
  //convert string to byte
  //https://ionicframework.com/docs/native/ble/
  // ASCII only
  stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }

  //convert byte to string
  // ASCII only
  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  // function to disconnect from bluetooth
  close(){
    if(this.espId != null){
      this.ble.disconnect(this.espId)
    }
    this.viewCtrl.dismiss();
  }

}
